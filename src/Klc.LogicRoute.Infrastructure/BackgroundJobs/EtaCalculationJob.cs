using Dapper;
using Klc.LogicRoute.Infrastructure.Persistence;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.BackgroundJobs;

public class EtaCalculationJob : BackgroundService
{
    private readonly IPostgresConnectionFactory _connectionFactory;
    private readonly ILogger<EtaCalculationJob> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    // Average truck speed in Turkey (km/h)
    private const double AverageSpeedKmh = 60.0;

    public EtaCalculationJob(
        IPostgresConnectionFactory connectionFactory,
        ILogger<EtaCalculationJob> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ETA Calculation Job started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CalculateEtasAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ETA calculation error");
            }

            await Task.Delay(Interval, stoppingToken);
        }

        _logger.LogInformation("ETA Calculation Job stopped");
    }

    private async Task CalculateEtasAsync(CancellationToken cancellationToken)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        // Get active shipments with current location and destination coordinates
        const string query = """
            SELECT s.id, s.current_latitude, s.current_longitude,
                   s.destination_address, s.destination_city,
                   s.estimated_arrival
            FROM logistics.shipments s
            WHERE s.status IN (6, 7) -- Loading, InTransit
              AND s.is_deleted = false
              AND s.current_latitude IS NOT NULL
              AND s.current_longitude IS NOT NULL
            """;

        var shipments = await connection.QueryAsync<ActiveShipment>(query);
        var updatedCount = 0;

        foreach (var shipment in shipments)
        {
            // Use Haversine formula to estimate distance to destination
            // For now, estimate based on current location to a rough destination coordinate
            // In production, this would use the actual destination coordinates from geocoding
            var estimatedHours = EstimateRemainingHours(shipment);
            if (estimatedHours is null) continue;

            var newEta = DateTime.UtcNow.AddHours(estimatedHours.Value);
            var etaString = newEta.ToString("yyyy-MM-ddTHH:mm:ssZ");

            const string updateSql = """
                UPDATE logistics.shipments SET estimated_arrival = @Eta, updated_at = NOW()
                WHERE id = @Id
                """;

            await connection.ExecuteAsync(updateSql, new { Eta = etaString, Id = shipment.Id });
            updatedCount++;
        }

        if (updatedCount > 0)
        {
            _logger.LogInformation("Updated ETA for {Count} active shipments", updatedCount);
        }
    }

    private static double? EstimateRemainingHours(ActiveShipment shipment)
    {
        if (shipment.CurrentLatitude is null || shipment.CurrentLongitude is null)
            return null;

        // Default destination coordinates for major Turkish cities
        // In production, these would come from geocoded destination addresses
        var destLat = GetCityLatitude(shipment.DestinationCity);
        var destLng = GetCityLongitude(shipment.DestinationCity);
        if (destLat is null || destLng is null)
            return null;

        var distanceKm = HaversineDistance(
            (double)shipment.CurrentLatitude, (double)shipment.CurrentLongitude,
            destLat.Value, destLng.Value);

        // If distance is very small, shipment is near destination
        if (distanceKm < 1.0) return 0.1;

        return distanceKm / AverageSpeedKmh;
    }

    private static double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0; // Earth radius in km
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;

    private static double? GetCityLatitude(string? city) => city?.ToLowerInvariant() switch
    {
        "istanbul" => 41.0082,
        "ankara" => 39.9334,
        "izmir" => 38.4192,
        "bursa" => 40.1827,
        "antalya" => 36.8969,
        "adana" => 36.9914,
        "konya" => 37.8746,
        "gaziantep" => 37.0662,
        "mersin" => 36.8121,
        "kayseri" => 38.7312,
        _ => null
    };

    private static double? GetCityLongitude(string? city) => city?.ToLowerInvariant() switch
    {
        "istanbul" => 28.9784,
        "ankara" => 32.8597,
        "izmir" => 27.1287,
        "bursa" => 29.0610,
        "antalya" => 30.7133,
        "adana" => 35.3308,
        "konya" => 32.4932,
        "gaziantep" => 37.3833,
        "mersin" => 34.6415,
        "kayseri" => 35.4787,
        _ => null
    };

    private class ActiveShipment
    {
        public Guid Id { get; set; }
        public decimal? CurrentLatitude { get; set; }
        public decimal? CurrentLongitude { get; set; }
        public string? DestinationAddress { get; set; }
        public string? DestinationCity { get; set; }
        public string? EstimatedArrival { get; set; }
    }
}
