using Klc.LogicRoute.Application.RouteOptimization.Models;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.RouteOptimization.Services;

public class VrpSolverService(IDistanceMatrixProvider distanceMatrixProvider) : IVrpSolverService
{
    public async Task<VrpResult> SolveAsync(VrpRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Vehicles.Count == 0 || request.Stops.Count == 0)
            return new VrpResult([], 0, 0, request.Stops);

        // Build all points: depots first, then stops
        var allPoints = new List<DistanceMatrixPoint>();
        foreach (var v in request.Vehicles)
            allPoints.Add(new DistanceMatrixPoint(v.DepotLat, v.DepotLng));
        foreach (var s in request.Stops)
            allPoints.Add(new DistanceMatrixPoint(s.Lat, s.Lng));

        var matrix = await distanceMatrixProvider.GetDistanceMatrixAsync(
            allPoints.ToArray(), cancellationToken);

        var vehicleCount = request.Vehicles.Count;
        var stopCount = request.Stops.Count;
        var assigned = new bool[stopCount];
        var routes = new List<VrpRoute>();
        var totalDistance = 0.0;
        var totalDuration = 0.0;

        // Nearest Neighbor heuristic per vehicle
        for (var v = 0; v < vehicleCount; v++)
        {
            var vehicle = request.Vehicles[v];
            var currentWeightKg = 0m;
            var currentVolumeM3 = 0m;
            var routeStops = new List<VrpRouteStop>();
            var routeDistance = 0.0;
            var routeDuration = 0.0;
            var currentIndex = v; // depot index
            var currentTime = DateTime.UtcNow;

            while (true)
            {
                var bestStopIdx = -1;
                var bestDistance = double.MaxValue;

                for (var s = 0; s < stopCount; s++)
                {
                    if (assigned[s]) continue;

                    var stop = request.Stops[s];
                    var matrixStopIdx = vehicleCount + s;

                    // Capacity check
                    if (currentWeightKg + stop.WeightKg > vehicle.CapacityKg) continue;
                    if (currentVolumeM3 + stop.VolumeM3 > vehicle.CapacityM3) continue;

                    var dist = matrix.Distances[currentIndex, matrixStopIdx];

                    // Time window check
                    if (stop.TimeWindowEnd.HasValue)
                    {
                        var travelMinutes = matrix.Durations[currentIndex, matrixStopIdx];
                        var arrivalTime = currentTime.AddMinutes(travelMinutes);
                        if (arrivalTime > stop.TimeWindowEnd.Value) continue;
                    }

                    if (dist < bestDistance)
                    {
                        bestDistance = dist;
                        bestStopIdx = s;
                    }
                }

                if (bestStopIdx < 0) break;

                var bestStop = request.Stops[bestStopIdx];
                var bestMatrixIdx = vehicleCount + bestStopIdx;
                var distKm = matrix.Distances[currentIndex, bestMatrixIdx];
                var durMin = matrix.Durations[currentIndex, bestMatrixIdx];

                var arrival = currentTime.AddMinutes(durMin);
                // Wait for time window if needed
                if (bestStop.TimeWindowStart.HasValue && arrival < bestStop.TimeWindowStart.Value)
                    arrival = bestStop.TimeWindowStart.Value;

                var departure = arrival.AddMinutes(bestStop.ServiceMinutes);

                routeStops.Add(new VrpRouteStop(
                    ShipmentId: bestStop.ShipmentId,
                    Order: routeStops.Count + 1,
                    Lat: bestStop.Lat,
                    Lng: bestStop.Lng,
                    DistanceFromPrevKm: distKm,
                    DurationFromPrevMinutes: durMin,
                    EstimatedArrival: arrival,
                    EstimatedDeparture: departure));

                routeDistance += distKm;
                routeDuration += durMin + bestStop.ServiceMinutes;
                currentWeightKg += bestStop.WeightKg;
                currentVolumeM3 += bestStop.VolumeM3;
                currentIndex = bestMatrixIdx;
                currentTime = departure;
                assigned[bestStopIdx] = true;
            }

            if (routeStops.Count == 0) continue;

            // Apply 2-opt improvement
            Apply2Opt(routeStops, matrix, v, vehicleCount);

            // Recalculate totals after 2-opt
            routeDistance = 0;
            routeDuration = 0;
            var prevIdx = v;
            foreach (var rs in routeStops)
            {
                var sIdx = vehicleCount + request.Stops.FindIndex(s => s.ShipmentId == rs.ShipmentId);
                routeDistance += matrix.Distances[prevIdx, sIdx];
                routeDuration += matrix.Durations[prevIdx, sIdx];
                prevIdx = sIdx;
            }

            routes.Add(new VrpRoute(
                VehicleId: vehicle.Id,
                VehiclePlate: vehicle.Plate,
                Stops: routeStops,
                TotalDistanceKm: routeDistance,
                TotalDurationMinutes: routeDuration,
                TotalWeightKg: currentWeightKg,
                TotalVolumeM3: currentVolumeM3));

            totalDistance += routeDistance;
            totalDuration += routeDuration;
        }

        // Collect unserved stops
        var unserved = new List<VrpStop>();
        for (var s = 0; s < stopCount; s++)
        {
            if (!assigned[s])
                unserved.Add(request.Stops[s]);
        }

        return new VrpResult(routes, totalDistance, totalDuration, unserved);
    }

    private static void Apply2Opt(List<VrpRouteStop> stops, DistanceMatrixResult matrix, int depotIdx, int vehicleCount)
    {
        if (stops.Count < 3) return;

        var improved = true;
        var maxIterations = 100;
        var iteration = 0;

        while (improved && iteration++ < maxIterations)
        {
            improved = false;
            for (var i = 0; i < stops.Count - 1; i++)
            {
                for (var j = i + 1; j < stops.Count; j++)
                {
                    var currentCost = Get2OptSegmentCost(stops, matrix, i, j, depotIdx, vehicleCount);
                    // Reverse segment [i..j]
                    stops.Reverse(i, j - i + 1);
                    var newCost = Get2OptSegmentCost(stops, matrix, i, j, depotIdx, vehicleCount);

                    if (newCost < currentCost - 0.01)
                    {
                        improved = true;
                        // Update order numbers
                        for (var k = 0; k < stops.Count; k++)
                            stops[k] = stops[k] with { Order = k + 1 };
                    }
                    else
                    {
                        // Revert
                        stops.Reverse(i, j - i + 1);
                    }
                }
            }
        }
    }

    private static double Get2OptSegmentCost(List<VrpRouteStop> stops, DistanceMatrixResult matrix,
        int from, int to, int depotIdx, int vehicleCount)
    {
        // Cost = dist from previous to stops[from] + dist within segment + dist from stops[to] to next
        // Simplified: just sum distances in the affected range
        double cost = 0;
        for (var k = from; k <= to; k++)
        {
            var prevLat = k == 0 ? depotIdx : vehicleCount + (stops[k - 1].Order - 1);
            var currIdx = vehicleCount + (stops[k].Order - 1);
            // Use indices based on position, not order (order may be stale during swap)
            // Fallback to Haversine estimate
            var dx = stops[k].Lat - (k == 0 ? 0 : stops[k - 1].Lat);
            var dy = stops[k].Lng - (k == 0 ? 0 : stops[k - 1].Lng);
            cost += Math.Sqrt(dx * dx + dy * dy) * 111.0; // rough km conversion
        }
        return cost;
    }
}
