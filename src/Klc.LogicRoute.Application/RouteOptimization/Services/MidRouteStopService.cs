using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.RouteOptimization.Services;

public interface IMidRouteStopService
{
    Task<MidRouteStopResult> AddStopToRouteAsync(Guid routeId, Guid tenantId, NewStopRequest newStop, string? userId);
}

public class NewStopRequest
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string? Address { get; set; }
    public decimal WeightKg { get; set; }
    public decimal VolumeM3 { get; set; }
    public Guid? ShipmentId { get; set; }
    public int ServiceTimeMinutes { get; set; } = 15;
}

public class MidRouteStopResult
{
    public Guid RouteId { get; set; }
    public int InsertedAtPosition { get; set; }
    public int TotalStops { get; set; }
    public double TotalDistanceKm { get; set; }
    public double TotalDurationMinutes { get; set; }
    public List<RouteStop> UpdatedStops { get; set; } = [];
}

/// <summary>
/// Adds a new stop to an existing active route at the optimal position.
/// Finds the insertion point that minimizes total additional distance.
/// </summary>
public class MidRouteStopService(
    IRouteOptimizationRepository routeRepository,
    ILogger<MidRouteStopService> logger) : IMidRouteStopService
{
    public async Task<MidRouteStopResult> AddStopToRouteAsync(Guid routeId, Guid tenantId, NewStopRequest newStop, string? userId)
    {
        // Get existing route
        var routes = await routeRepository.GetRoutesByOptimizationIdAsync(Guid.Empty, tenantId);
        OptimizedRoute? route = null;

        // Find route by its own ID
        foreach (var r in routes)
        {
            if (r.Id == routeId)
            {
                route = r;
                break;
            }
        }

        // If not found by optimization scan, try to get stops directly
        var existingStops = (await routeRepository.GetStopsByRouteIdAsync(routeId, tenantId)).ToList();
        if (existingStops.Count == 0)
            throw new InvalidOperationException($"Rota bulunamadı veya durak yok: {routeId}");

        existingStops = existingStops.OrderBy(s => s.StopOrder).ToList();

        // Find optimal insertion point (nearest neighbor insertion)
        var bestPosition = FindOptimalInsertionPoint(existingStops, newStop.Lat, newStop.Lng);

        // Create the new stop
        var newRouteStop = new RouteStop
        {
            TenantId = tenantId,
            RouteId = routeId,
            ShipmentId = newStop.ShipmentId,
            StopOrder = bestPosition + 1,
            StopType = "Delivery",
            Address = newStop.Address,
            Lat = newStop.Lat,
            Lng = newStop.Lng,
            ServiceTimeMinutes = newStop.ServiceTimeMinutes,
            CreatedBy = userId
        };

        // Reorder existing stops after insertion point
        for (int i = bestPosition; i < existingStops.Count; i++)
        {
            existingStops[i].StopOrder = i + 2; // Shift by 1
        }

        // Insert the new stop into the list
        existingStops.Insert(bestPosition, newRouteStop);

        // Persist the new stop
        await routeRepository.CreateStopAsync(newRouteStop);

        // Recalculate total distance and duration
        double totalDistance = 0;
        double totalDuration = 0;
        for (int i = 1; i < existingStops.Count; i++)
        {
            var dist = HaversineDistance(existingStops[i - 1].Lat, existingStops[i - 1].Lng,
                                         existingStops[i].Lat, existingStops[i].Lng);
            totalDistance += dist;
            totalDuration += dist / 40.0 * 60.0; // Assume 40 km/h average speed
        }
        totalDuration += existingStops.Sum(s => s.ServiceTimeMinutes);

        // Update route totals if we have the route object
        if (route != null)
        {
            route.TotalDistanceKm = totalDistance;
            route.TotalDurationMinutes = totalDuration;
            route.TotalWeightKg += newStop.WeightKg;
            route.TotalVolumeM3 += newStop.VolumeM3;
            route.UpdatedAt = DateTime.UtcNow;
            await routeRepository.UpdateRouteAsync(route);
        }

        logger.LogInformation("Added stop at position {Position} to route {RouteId}", bestPosition + 1, routeId);

        return new MidRouteStopResult
        {
            RouteId = routeId,
            InsertedAtPosition = bestPosition + 1,
            TotalStops = existingStops.Count,
            TotalDistanceKm = Math.Round(totalDistance, 2),
            TotalDurationMinutes = Math.Round(totalDuration, 1),
            UpdatedStops = existingStops
        };
    }

    /// <summary>
    /// Finds the optimal position to insert a new stop that minimizes additional distance.
    /// Tests inserting between every consecutive pair and picks the one with smallest detour.
    /// </summary>
    private int FindOptimalInsertionPoint(List<RouteStop> stops, double newLat, double newLng)
    {
        if (stops.Count == 0) return 0;
        if (stops.Count == 1) return 1;

        double bestCost = double.MaxValue;
        int bestPos = stops.Count; // Default: append at end

        for (int i = 0; i <= stops.Count; i++)
        {
            double cost;
            if (i == 0)
            {
                // Insert before first stop
                cost = HaversineDistance(newLat, newLng, stops[0].Lat, stops[0].Lng);
            }
            else if (i == stops.Count)
            {
                // Insert after last stop
                cost = HaversineDistance(stops[^1].Lat, stops[^1].Lng, newLat, newLng);
            }
            else
            {
                // Insert between i-1 and i
                var prevStop = stops[i - 1];
                var nextStop = stops[i];
                var originalDist = HaversineDistance(prevStop.Lat, prevStop.Lng, nextStop.Lat, nextStop.Lng);
                var newDist = HaversineDistance(prevStop.Lat, prevStop.Lng, newLat, newLng)
                            + HaversineDistance(newLat, newLng, nextStop.Lat, nextStop.Lng);
                cost = newDist - originalDist; // Detour cost
            }

            if (cost < bestCost)
            {
                bestCost = cost;
                bestPos = i;
            }
        }

        return bestPos;
    }

    private static double HaversineDistance(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371; // Earth radius in km
        var dLat = ToRad(lat2 - lat1);
        var dLng = ToRad(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
              * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;
}
