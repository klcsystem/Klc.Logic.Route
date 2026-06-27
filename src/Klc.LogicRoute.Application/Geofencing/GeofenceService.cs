using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Geofencing;

public class GeofenceService : IGeofenceService
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IDriverRepository _driverRepository;
    private readonly ICacheService _cacheService;
    private readonly ILogger<GeofenceService> _logger;

    /// <summary>
    /// Default geofence radius in meters around each delivery point.
    /// </summary>
    private const double DefaultRadiusMeters = 200.0;

    // Earth radius in meters for Haversine calculation
    private const double EarthRadiusMeters = 6_371_000.0;

    public GeofenceService(
        IShipmentRepository shipmentRepository,
        IOrderRepository orderRepository,
        IDriverRepository driverRepository,
        ICacheService cacheService,
        ILogger<GeofenceService> logger)
    {
        _shipmentRepository = shipmentRepository;
        _orderRepository = orderRepository;
        _driverRepository = driverRepository;
        _cacheService = cacheService;
        _logger = logger;
    }

    public double GetRadiusMeters() => DefaultRadiusMeters;

    public async Task<IReadOnlyList<GeofenceEvent>> CheckLocationAsync(
        Guid driverId,
        Guid tenantId,
        double lat,
        double lng,
        Guid? shipmentId)
    {
        var events = new List<GeofenceEvent>();

        try
        {
            // Get active shipments for this driver
            var shipments = await GetActiveShipmentsForDriverAsync(driverId, tenantId);

            foreach (var (sId, destLat, destLng) in shipments)
            {
                // If shipmentId is specified, only check that shipment
                if (shipmentId.HasValue && sId != shipmentId.Value)
                    continue;

                var distance = CalculateHaversineDistance(lat, lng, destLat, destLng);
                var isInsideGeofence = distance <= DefaultRadiusMeters;

                // Get previous state from cache
                var cacheKey = $"geofence:driver:{driverId}:shipment:{sId}";
                var previousState = await _cacheService.GetAsync<GeofenceState>(cacheKey);
                var wasInsideGeofence = previousState?.IsInside ?? false;

                if (isInsideGeofence && !wasInsideGeofence)
                {
                    // Driver just entered the geofence -> ARRIVED
                    var geofenceEvent = new GeofenceEvent(
                        driverId, sId, tenantId,
                        GeofenceEventType.Arrived,
                        lat, lng, destLat, destLng,
                        distance,
                        DateTime.UtcNow);

                    events.Add(geofenceEvent);

                    _logger.LogInformation(
                        "Geofence ARRIVED: Driver {DriverId} entered geofence for Shipment {ShipmentId} " +
                        "(distance: {Distance:F1}m, radius: {Radius}m)",
                        driverId, sId, distance, DefaultRadiusMeters);
                }
                else if (!isInsideGeofence && wasInsideGeofence)
                {
                    // Driver just left the geofence -> DEPARTED
                    var geofenceEvent = new GeofenceEvent(
                        driverId, sId, tenantId,
                        GeofenceEventType.Departed,
                        lat, lng, destLat, destLng,
                        distance,
                        DateTime.UtcNow);

                    events.Add(geofenceEvent);

                    _logger.LogInformation(
                        "Geofence DEPARTED: Driver {DriverId} left geofence for Shipment {ShipmentId} " +
                        "(distance: {Distance:F1}m, radius: {Radius}m)",
                        driverId, sId, distance, DefaultRadiusMeters);
                }

                // Update state in cache (24h TTL)
                await _cacheService.SetAsync(cacheKey,
                    new GeofenceState(isInsideGeofence, DateTime.UtcNow),
                    TimeSpan.FromHours(24));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking geofence for Driver {DriverId}", driverId);
        }

        return events;
    }

    /// <summary>
    /// Get active shipments for a driver with their destination coordinates.
    /// Returns tuples of (ShipmentId, DestinationLat, DestinationLng).
    /// </summary>
    private async Task<List<(Guid ShipmentId, double DestLat, double DestLng)>> GetActiveShipmentsForDriverAsync(
        Guid driverId, Guid tenantId)
    {
        var result = new List<(Guid, double, double)>();

        var driver = await _driverRepository.GetByIdAsync(driverId);
        if (driver == null || !driver.IsActive)
            return result;

        // Get all active shipments for this driver
        var allShipments = await _shipmentRepository.GetAllAsync(tenantId, 1, 200);
        var activeShipments = allShipments.Where(s =>
            s.DriverName == driver.FullName &&
            s.Status is ShipmentStatus.InTransit or ShipmentStatus.Loading or ShipmentStatus.VehicleAssigned &&
            !s.IsDeleted);

        foreach (var shipment in activeShipments)
        {
            // Try to get destination coordinates from the linked order
            if (shipment.OrderId.HasValue)
            {
                var order = await _orderRepository.GetByIdAsync(shipment.OrderId.Value, tenantId);
                if (order?.DestinationLat != null && order.DestinationLng != null)
                {
                    result.Add((shipment.Id, order.DestinationLat.Value, order.DestinationLng.Value));
                }
            }
        }

        return result;
    }

    /// <summary>
    /// Calculates the great-circle distance between two points on Earth
    /// using the Haversine formula.
    /// </summary>
    /// <returns>Distance in meters</returns>
    public static double CalculateHaversineDistance(
        double lat1, double lng1,
        double lat2, double lng2)
    {
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLng = DegreesToRadians(lng2 - lng1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusMeters * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;
}

/// <summary>
/// Represents the cached geofence state for a driver-shipment pair.
/// </summary>
public record GeofenceState(bool IsInside, DateTime LastUpdated);
