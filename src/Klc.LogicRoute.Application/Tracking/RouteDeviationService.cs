using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Geofencing;
using Klc.LogicRoute.Application.Notifications;
using Klc.LogicRoute.Application.Tracking.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Tracking;

public class RouteDeviationService : IRouteDeviationService
{
    private readonly IRouteOptimizationRepository _routeOptimizationRepository;
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ICacheService _cacheService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<RouteDeviationService> _logger;

    /// <summary>
    /// Deviation threshold in meters. If a driver is farther than this from the
    /// planned route, a ROUTE_DEVIATION alert is triggered.
    /// </summary>
    private const double DeviationThresholdMeters = 2_000.0;

    /// <summary>
    /// Cooldown period: don't alert again for the same driver within this window.
    /// </summary>
    private static readonly TimeSpan CooldownPeriod = TimeSpan.FromMinutes(10);

    public RouteDeviationService(
        IRouteOptimizationRepository routeOptimizationRepository,
        IShipmentRepository shipmentRepository,
        ICacheService cacheService,
        INotificationService notificationService,
        ILogger<RouteDeviationService> logger)
    {
        _routeOptimizationRepository = routeOptimizationRepository;
        _shipmentRepository = shipmentRepository;
        _cacheService = cacheService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<DeviationAlert?> CheckDeviationAsync(
        Guid driverId,
        Guid tenantId,
        double lat,
        double lng,
        Guid? shipmentId)
    {
        try
        {
            // Check cooldown first
            var cooldownKey = $"route_deviation:cooldown:{driverId}";
            var cooldownState = await _cacheService.GetAsync<DeviationCooldownState>(cooldownKey);
            if (cooldownState != null)
                return null; // Still in cooldown

            // Get all optimization results for this tenant to find an active route for this driver
            var optimizations = await _routeOptimizationRepository.GetAllAsync(tenantId, 1, 50);
            var completedOptimizations = optimizations
                .Where(o => o.Status == "Completed" && !o.IsDeleted)
                .OrderByDescending(o => o.CreatedAt);

            foreach (var optimization in completedOptimizations)
            {
                var routes = await _routeOptimizationRepository.GetRoutesByOptimizationIdAsync(optimization.Id, tenantId);

                foreach (var route in routes)
                {
                    var stops = (await _routeOptimizationRepository.GetStopsByRouteIdAsync(route.Id, tenantId))
                        .OrderBy(s => s.StopOrder)
                        .ToList();

                    if (stops.Count < 2)
                        continue;

                    // If shipmentId is specified, check if this route contains it
                    if (shipmentId.HasValue && !stops.Any(s => s.ShipmentId == shipmentId.Value))
                        continue;

                    // Calculate minimum distance from current position to any route segment
                    var (minDistance, nearestLat, nearestLng) = CalculateMinDistanceToRoute(lat, lng, stops);

                    if (minDistance > DeviationThresholdMeters)
                    {
                        var alert = new DeviationAlert(
                            driverId,
                            shipmentId ?? stops.First(s => s.ShipmentId.HasValue).ShipmentId!.Value,
                            tenantId,
                            lat,
                            lng,
                            nearestLat,
                            nearestLng,
                            minDistance,
                            DateTime.UtcNow);

                        // Set cooldown
                        await _cacheService.SetAsync(cooldownKey,
                            new DeviationCooldownState(DateTime.UtcNow),
                            CooldownPeriod);

                        // Send notification
                        await _notificationService.SendToAllAsync(
                            tenantId,
                            "Rota Sapma Uyarisi",
                            $"Surucu rotasindan {minDistance:F0}m sapma gosteriyor. Konum: ({lat:F5}, {lng:F5})",
                            NotificationType.Warning);

                        _logger.LogWarning(
                            "ROUTE_DEVIATION: Driver {DriverId} deviated {Distance:F0}m from planned route " +
                            "(threshold: {Threshold}m, position: {Lat},{Lng})",
                            driverId, minDistance, DeviationThresholdMeters, lat, lng);

                        return alert;
                    }

                    // Found a matching route and driver is on track
                    return null;
                }
            }

            // No matching route found — cannot check deviation
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking route deviation for Driver {DriverId}", driverId);
            return null;
        }
    }

    /// <summary>
    /// Calculates the minimum distance from a point to the polyline defined by route stops.
    /// Returns (minDistance in meters, nearestLat, nearestLng).
    /// </summary>
    private static (double MinDistance, double NearestLat, double NearestLng) CalculateMinDistanceToRoute(
        double lat, double lng, List<RouteStop> stops)
    {
        var minDistance = double.MaxValue;
        var nearestLat = stops[0].Lat;
        var nearestLng = stops[0].Lng;

        for (var i = 0; i < stops.Count - 1; i++)
        {
            var (dist, projLat, projLng) = DistanceToSegment(
                lat, lng,
                stops[i].Lat, stops[i].Lng,
                stops[i + 1].Lat, stops[i + 1].Lng);

            if (dist < minDistance)
            {
                minDistance = dist;
                nearestLat = projLat;
                nearestLng = projLng;
            }
        }

        return (minDistance, nearestLat, nearestLng);
    }

    /// <summary>
    /// Calculates the distance from a point to a line segment (great-circle approximation).
    /// Projects the point onto the segment and returns the distance to the nearest point on the segment.
    /// </summary>
    private static (double Distance, double ProjLat, double ProjLng) DistanceToSegment(
        double pLat, double pLng,
        double aLat, double aLng,
        double bLat, double bLng)
    {
        // Use a linear approximation for the projection (valid for short segments)
        var dx = bLng - aLng;
        var dy = bLat - aLat;
        var lengthSq = dx * dx + dy * dy;

        double projLat, projLng;

        if (lengthSq < 1e-12)
        {
            // Segment is essentially a point
            projLat = aLat;
            projLng = aLng;
        }
        else
        {
            // Parameter t represents position along segment [0,1]
            var t = ((pLng - aLng) * dx + (pLat - aLat) * dy) / lengthSq;
            t = Math.Max(0, Math.Min(1, t));
            projLat = aLat + t * dy;
            projLng = aLng + t * dx;
        }

        var distance = GeofenceService.CalculateHaversineDistance(pLat, pLng, projLat, projLng);
        return (distance, projLat, projLng);
    }
}

internal record DeviationCooldownState(DateTime LastAlertedAt);
