using Google.OrTools.ConstraintSolver;
using Google.Protobuf.WellKnownTypes;
using Klc.LogicRoute.Application.RouteOptimization.Models;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.RouteOptimization.Services;

/// <summary>
/// VRP solver using Google OR-Tools Constraint Solver with CVRPTW
/// (Capacitated Vehicle Routing Problem with Time Windows).
/// Supports weight+volume capacity constraints, time windows, and workload balancing.
/// Falls back to the legacy NN+2-Opt solver on failure.
/// </summary>
public class OrToolsVrpSolverService : IVrpSolverService
{
    private readonly IDistanceMatrixProvider _distanceMatrixProvider;
    private readonly VrpSolverService _fallbackSolver;
    private readonly ILogger<OrToolsVrpSolverService> _logger;

    // Scale factors to convert doubles to long (OR-Tools uses integer arithmetic)
    private const long DistanceScaleFactor = 1000; // 3 decimal places for km
    private const long DurationScaleFactor = 100;  // 2 decimal places for minutes
    private const long CapacityScaleFactor = 100;  // 2 decimal places for kg/m3

    public OrToolsVrpSolverService(
        IDistanceMatrixProvider distanceMatrixProvider,
        ILogger<OrToolsVrpSolverService> logger)
    {
        _distanceMatrixProvider = distanceMatrixProvider;
        _fallbackSolver = new VrpSolverService(distanceMatrixProvider);
        _logger = logger;
    }

    public async Task<VrpResult> SolveAsync(VrpRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Vehicles.Count == 0 || request.Stops.Count == 0)
            return new VrpResult([], 0, 0, request.Stops);

        try
        {
            return await SolveWithOrToolsAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OR-Tools solver failed, falling back to NN+2-Opt heuristic");
            return await _fallbackSolver.SolveAsync(request, cancellationToken);
        }
    }

    private async Task<VrpResult> SolveWithOrToolsAsync(VrpRequest request, CancellationToken cancellationToken)
    {
        var vehicleCount = request.Vehicles.Count;
        var stopCount = request.Stops.Count;

        // Build distance matrix points: depots first, then stops
        var allPoints = new List<DistanceMatrixPoint>();
        foreach (var v in request.Vehicles)
            allPoints.Add(new DistanceMatrixPoint(v.DepotLat, v.DepotLng));
        foreach (var s in request.Stops)
            allPoints.Add(new DistanceMatrixPoint(s.Lat, s.Lng));

        var matrix = await _distanceMatrixProvider.GetDistanceMatrixAsync(
            allPoints.ToArray(), cancellationToken);

        // OR-Tools node count: each vehicle has a unique depot node, plus all stops
        // We model this with vehicleCount depot nodes (indices 0..vehicleCount-1) and
        // stopCount stop nodes (indices vehicleCount..vehicleCount+stopCount-1).
        var nodeCount = vehicleCount + stopCount;

        // Create the routing index manager.
        // Each vehicle starts and ends at its own depot node.
        var starts = new int[vehicleCount];
        var ends = new int[vehicleCount];
        for (var v = 0; v < vehicleCount; v++)
        {
            starts[v] = v;
            ends[v] = v;
        }

        var manager = new RoutingIndexManager(nodeCount, vehicleCount, starts, ends);
        var routing = new RoutingModel(manager);

        // --- Distance callback ---
        var distanceCallback = routing.RegisterTransitCallback((fromIndex, toIndex) =>
        {
            var fromNode = manager.IndexToNode(fromIndex);
            var toNode = manager.IndexToNode(toIndex);
            return (long)(matrix.Distances[fromNode, toNode] * DistanceScaleFactor);
        });
        routing.SetArcCostEvaluatorOfAllVehicles(distanceCallback);

        // --- Duration / Time dimension (for time windows) ---
        var durationCallback = routing.RegisterTransitCallback((fromIndex, toIndex) =>
        {
            var fromNode = manager.IndexToNode(fromIndex);
            var toNode = manager.IndexToNode(toIndex);
            var travelMinutes = matrix.Durations[fromNode, toNode];

            // Add service time at the 'from' node if it's a stop (not a depot)
            if (fromNode >= vehicleCount)
            {
                var stopIdx = fromNode - vehicleCount;
                travelMinutes += request.Stops[stopIdx].ServiceMinutes;
            }

            return (long)(travelMinutes * DurationScaleFactor);
        });

        // Max route duration: 24 hours in scaled minutes
        var maxRouteDuration = (long)(24 * 60 * DurationScaleFactor);
        routing.AddDimension(
            durationCallback,
            maxRouteDuration, // allow waiting (slack)
            maxRouteDuration, // max cumulative time per vehicle
            false,            // don't force start cumul to zero (allows flexible start)
            "Duration");

        var durationDimension = routing.GetMutableDimension("Duration");

        // Set time windows for stops
        var referenceTime = DateTime.UtcNow;
        for (var s = 0; s < stopCount; s++)
        {
            var stop = request.Stops[s];
            var nodeIndex = manager.NodeToIndex(vehicleCount + s);

            if (stop.TimeWindowStart.HasValue || stop.TimeWindowEnd.HasValue)
            {
                var twStart = stop.TimeWindowStart.HasValue
                    ? (long)((stop.TimeWindowStart.Value - referenceTime).TotalMinutes * DurationScaleFactor)
                    : 0;
                var twEnd = stop.TimeWindowEnd.HasValue
                    ? (long)((stop.TimeWindowEnd.Value - referenceTime).TotalMinutes * DurationScaleFactor)
                    : maxRouteDuration;

                // Clamp to valid range
                twStart = Math.Max(0, twStart);
                twEnd = Math.Max(twStart, Math.Min(twEnd, maxRouteDuration));

                durationDimension.CumulVar(nodeIndex).SetRange(twStart, twEnd);
            }
            else
            {
                durationDimension.CumulVar(nodeIndex).SetRange(0, maxRouteDuration);
            }
        }

        // Set depot time windows (unconstrained)
        for (var v = 0; v < vehicleCount; v++)
        {
            var startIndex = routing.Start(v);
            var endIndex = routing.End(v);
            durationDimension.CumulVar(startIndex).SetRange(0, maxRouteDuration);
            durationDimension.CumulVar(endIndex).SetRange(0, maxRouteDuration);
        }

        // Minimize global span (latest route end - earliest route start) for workload balancing
        durationDimension.SetGlobalSpanCostCoefficient(100);

        // --- Weight capacity dimension ---
        var weightCallback = routing.RegisterUnaryTransitCallback(fromIndex =>
        {
            var fromNode = manager.IndexToNode(fromIndex);
            if (fromNode < vehicleCount) return 0; // depot
            var stopIdx = fromNode - vehicleCount;
            return (long)(request.Stops[stopIdx].WeightKg * CapacityScaleFactor);
        });

        var maxWeight = request.Vehicles.Max(v => v.CapacityKg);
        routing.AddDimensionWithVehicleCapacity(
            weightCallback,
            0, // no slack
            request.Vehicles.Select(v => (long)(v.CapacityKg * CapacityScaleFactor)).ToArray(),
            true, // start cumul at zero
            "Weight");

        // --- Volume capacity dimension ---
        var volumeCallback = routing.RegisterUnaryTransitCallback(fromIndex =>
        {
            var fromNode = manager.IndexToNode(fromIndex);
            if (fromNode < vehicleCount) return 0; // depot
            var stopIdx = fromNode - vehicleCount;
            return (long)(request.Stops[stopIdx].VolumeM3 * CapacityScaleFactor);
        });

        routing.AddDimensionWithVehicleCapacity(
            volumeCallback,
            0,
            request.Vehicles.Select(v => (long)(v.CapacityM3 * CapacityScaleFactor)).ToArray(),
            true,
            "Volume");

        // --- Workload balancing: add cost on count dimension span ---
        var countCallback = routing.RegisterUnaryTransitCallback(fromIndex =>
        {
            var fromNode = manager.IndexToNode(fromIndex);
            return fromNode >= vehicleCount ? 1 : 0; // count stops only
        });

        routing.AddDimension(
            countCallback,
            0,
            stopCount, // max stops per vehicle
            true,
            "StopCount");

        var countDimension = routing.GetMutableDimension("StopCount");
        countDimension.SetGlobalSpanCostCoefficient(50);

        // Duraklar mümkün olduğunca DÜŞÜRÜLMESİN: drop cezası herhangi bir rota maliyetinden çok yüksek.
        // Böylece kapasite/zaman açısından servis edilebilen HER durak bir araca atanır (uzak duraklar
        // uzun rota pahasına da olsa). Yalnızca gerçekten olanaksız (kapasiteye sığmayan) duraklar düşer.
        var dropPenalty = (long)(100_000 * DistanceScaleFactor);
        for (var s = 0; s < stopCount; s++)
        {
            routing.AddDisjunction(
                [manager.NodeToIndex(vehicleCount + s)],
                dropPenalty);
        }

        // --- Search parameters ---
        var searchParams = operations_research_constraint_solver.DefaultRoutingSearchParameters();
        searchParams.FirstSolutionStrategy = FirstSolutionStrategy.Types.Value.PathCheapestArc;
        searchParams.LocalSearchMetaheuristic = LocalSearchMetaheuristic.Types.Value.GuidedLocalSearch;
        searchParams.TimeLimit = new Duration { Seconds = GetTimeLimitSeconds(stopCount, vehicleCount) };
        searchParams.LogSearch = false;

        _logger.LogInformation(
            "Starting OR-Tools CVRPTW solver: {StopCount} stops, {VehicleCount} vehicles, time limit {Seconds}s",
            stopCount, vehicleCount, searchParams.TimeLimit.Seconds);

        // --- Solve ---
        var solution = routing.SolveWithParameters(searchParams);

        if (solution == null)
        {
            _logger.LogWarning("OR-Tools found no solution, falling back to NN+2-Opt");
            return await _fallbackSolver.SolveAsync(request, cancellationToken);
        }

        // --- Extract solution ---
        return ExtractSolution(request, routing, manager, solution, matrix, referenceTime);
    }

    private VrpResult ExtractSolution(
        VrpRequest request,
        RoutingModel routing,
        RoutingIndexManager manager,
        Assignment solution,
        DistanceMatrixResult matrix,
        DateTime referenceTime)
    {
        var vehicleCount = request.Vehicles.Count;
        var stopCount = request.Stops.Count;
        var routes = new List<VrpRoute>();
        var totalDistance = 0.0;
        var totalDuration = 0.0;
        var servedStopIndices = new HashSet<int>();

        var durationDimension = routing.GetMutableDimension("Duration");

        for (var v = 0; v < vehicleCount; v++)
        {
            var vehicle = request.Vehicles[v];
            var routeStops = new List<VrpRouteStop>();
            var routeDistance = 0.0;
            var routeDuration = 0.0;
            var totalWeightKg = 0m;
            var totalVolumeM3 = 0m;

            var index = routing.Start(v);
            var prevNode = manager.IndexToNode(index);

            while (!routing.IsEnd(index))
            {
                var nextIndex = solution.Value(routing.NextVar(index));
                var nextNode = manager.IndexToNode(nextIndex);

                // Only add stop nodes (skip depot)
                if (nextNode >= vehicleCount && !routing.IsEnd(nextIndex))
                {
                    var stopIdx = nextNode - vehicleCount;
                    var stop = request.Stops[stopIdx];
                    servedStopIndices.Add(stopIdx);

                    var distKm = matrix.Distances[prevNode, nextNode];
                    var durMin = matrix.Durations[prevNode, nextNode];

                    // Get cumulative time from solution for accurate arrival time
                    var cumulTime = solution.Value(durationDimension.CumulVar(nextIndex));
                    var arrivalMinutes = (double)cumulTime / DurationScaleFactor;
                    var arrival = referenceTime.AddMinutes(arrivalMinutes);
                    var departure = arrival.AddMinutes(stop.ServiceMinutes);

                    routeStops.Add(new VrpRouteStop(
                        ShipmentId: stop.ShipmentId,
                        Order: routeStops.Count + 1,
                        Lat: stop.Lat,
                        Lng: stop.Lng,
                        DistanceFromPrevKm: distKm,
                        DurationFromPrevMinutes: durMin,
                        EstimatedArrival: arrival,
                        EstimatedDeparture: departure));

                    routeDistance += distKm;
                    routeDuration += durMin + stop.ServiceMinutes;
                    totalWeightKg += stop.WeightKg;
                    totalVolumeM3 += stop.VolumeM3;
                }

                prevNode = nextNode;
                index = nextIndex;
            }

            if (routeStops.Count == 0) continue;

            routes.Add(new VrpRoute(
                VehicleId: vehicle.Id,
                VehiclePlate: vehicle.Plate,
                Stops: routeStops,
                TotalDistanceKm: routeDistance,
                TotalDurationMinutes: routeDuration,
                TotalWeightKg: totalWeightKg,
                TotalVolumeM3: totalVolumeM3));

            totalDistance += routeDistance;
            totalDuration += routeDuration;
        }

        // Collect unserved stops
        var unserved = new List<VrpStop>();
        for (var s = 0; s < stopCount; s++)
        {
            if (!servedStopIndices.Contains(s))
                unserved.Add(request.Stops[s]);
        }

        _logger.LogInformation(
            "OR-Tools solution: {RouteCount} routes, {TotalDistance:F1} km, {UnservedCount} unserved stops",
            routes.Count, totalDistance, unserved.Count);

        return new VrpResult(routes, totalDistance, totalDuration, unserved);
    }

    /// <summary>
    /// Adaptive time limit based on problem size.
    /// Small problems solve fast, larger ones get more time.
    /// </summary>
    private static long GetTimeLimitSeconds(int stopCount, int vehicleCount)
    {
        var complexity = stopCount * vehicleCount;
        return complexity switch
        {
            < 50 => 5,
            < 200 => 10,
            < 500 => 20,
            < 1000 => 30,
            _ => 60
        };
    }
}
