using System.Net.Http.Json;
using System.Text.Json;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Routing;

public class OsrmDistanceMatrixProvider : IDistanceMatrixProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OsrmDistanceMatrixProvider> _logger;
    private readonly string _baseUrl;

    public OsrmDistanceMatrixProvider(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<OsrmDistanceMatrixProvider> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _baseUrl = configuration["Routing:OsrmBaseUrl"] ?? "https://router.project-osrm.org";
    }

    // Public OSRM /table demo sunucusu ~100 koordinat ile sınırlı; üstünde istek asılı kalır/reddedilir.
    private const int OsrmMaxPoints = 100;

    public async Task<DistanceMatrixResult> GetDistanceMatrixAsync(DistanceMatrixPoint[] points, CancellationToken cancellationToken = default)
    {
        // Çok fazla nokta → public OSRM /table kaldırmaz (asılı kalır); doğrudan Haversine'e düş.
        if (points.Length > OsrmMaxPoints)
        {
            _logger.LogInformation("Matris {Count} nokta > {Max} sınırı; OSRM atlanıp Haversine kullanılıyor", points.Length, OsrmMaxPoints);
            return CalculateHaversineMatrix(points);
        }

        try
        {
            // Yavaş/yanıtsız demo sunucu isteği asılı bırakmasın diye kısa timeout.
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            // Public OSRM demo cogu zaman yavas/erisilemez; uzun timeout solve'u 10sn+ bekletip
            // "hesaplamiyor" hissi veriyordu. Hizli basarisiz olup Haversine'e dus (3sn).
            cts.CancelAfter(TimeSpan.FromSeconds(3));
            return await GetOsrmMatrixAsync(points, cts.Token);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OSRM matrix isteği başarısız/timeout, Haversine'e düşülüyor");
            return CalculateHaversineMatrix(points);
        }
    }

    private async Task<DistanceMatrixResult> GetOsrmMatrixAsync(DistanceMatrixPoint[] points, CancellationToken cancellationToken)
    {
        // OSRM table endpoint: /table/v1/driving/{coordinates}
        var coordinates = string.Join(";", points.Select(p => $"{p.Lng},{p.Lat}"));
        var url = $"{_baseUrl}/table/v1/driving/{coordinates}?annotations=distance,duration";

        var response = await _httpClient.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<OsrmTableResponse>(cancellationToken: cancellationToken);
        if (json?.Code != "Ok" || json.Distances == null || json.Durations == null)
            throw new InvalidOperationException($"OSRM returned: {json?.Code}");

        var n = points.Length;
        var distances = new double[n, n];
        var durations = new double[n, n];

        for (var i = 0; i < n; i++)
        {
            for (var j = 0; j < n; j++)
            {
                distances[i, j] = json.Distances[i][j] / 1000.0; // meters to km
                durations[i, j] = json.Durations[i][j] / 60.0;   // seconds to minutes
            }
        }

        _logger.LogInformation("OSRM distance matrix calculated for {Count} points", n);
        return new DistanceMatrixResult(distances, durations);
    }

    private static DistanceMatrixResult CalculateHaversineMatrix(DistanceMatrixPoint[] points)
    {
        var n = points.Length;
        var distances = new double[n, n];
        var durations = new double[n, n];
        const double avgSpeedKmh = 60.0;

        for (var i = 0; i < n; i++)
        {
            for (var j = 0; j < n; j++)
            {
                if (i == j) continue;
                var distKm = HaversineDistance(points[i].Lat, points[i].Lng, points[j].Lat, points[j].Lng);
                distances[i, j] = distKm;
                durations[i, j] = (distKm / avgSpeedKmh) * 60.0; // minutes
            }
        }

        return new DistanceMatrixResult(distances, durations);
    }

    private static double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLon = (lon2 - lon1) * Math.PI / 180.0;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private class OsrmTableResponse
    {
        public string? Code { get; set; }
        public double[][]? Distances { get; set; }
        public double[][]? Durations { get; set; }
    }
}
