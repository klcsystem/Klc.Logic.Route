using Klc.LogicRoute.Application.RouteOptimization.Models;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.RouteOptimization.Services;

public class DynamicRerouteService : IDynamicRerouteService
{
    private readonly IDistanceMatrixProvider _distanceMatrixProvider;
    private readonly IVrpSolverService _vrpSolverService;
    private readonly ILogger<DynamicRerouteService> _logger;

    public DynamicRerouteService(
        IDistanceMatrixProvider distanceMatrixProvider,
        IVrpSolverService vrpSolverService,
        ILogger<DynamicRerouteService> logger)
    {
        _distanceMatrixProvider = distanceMatrixProvider;
        _vrpSolverService = vrpSolverService;
        _logger = logger;
    }

    public async Task<RerouteResult> RerouteAsync(RerouteRequest request, CancellationToken cancellationToken = default)
    {
        var cancelledSet = new HashSet<Guid>(request.CancelledShipmentIds);

        // Filter out cancelled stops from remaining
        var activeStops = request.RemainingStops
            .Where(s => !cancelledSet.Contains(s.ShipmentId))
            .ToList();

        var stopsRemoved = request.RemainingStops.Count - activeStops.Count;

        // Add new stops
        activeStops.AddRange(request.NewStops);
        var stopsAdded = request.NewStops.Count;

        _logger.LogInformation(
            "Dynamic reroute for vehicle {VehicleId}: {Remaining} remaining, {Added} added, {Removed} cancelled",
            request.VehicleId, activeStops.Count, stopsAdded, stopsRemoved);

        if (activeStops.Count == 0)
        {
            var emptyRoute = new VrpRoute(
                VehicleId: request.VehicleId,
                VehiclePlate: request.VehiclePlate,
                Stops: [],
                TotalDistanceKm: 0,
                TotalDurationMinutes: 0,
                TotalWeightKg: request.CurrentWeightKg,
                TotalVolumeM3: request.CurrentVolumeM3);

            return new RerouteResult(emptyRoute, [], 0, 0, stopsAdded, stopsRemoved,
                "All stops cancelled or no remaining stops");
        }

        // Build a single-vehicle VRP request using current position as depot
        var vehicle = new VrpVehicle(
            Id: request.VehicleId,
            Plate: request.VehiclePlate,
            CapacityKg: request.CapacityKg - request.CurrentWeightKg,
            CapacityM3: request.CapacityM3 - request.CurrentVolumeM3,
            DepotLat: request.CurrentLat,
            DepotLng: request.CurrentLng);

        var vrpRequest = new VrpRequest(
            Vehicles: [vehicle],
            Stops: activeStops);

        var vrpResult = await _vrpSolverService.SolveAsync(vrpRequest, cancellationToken);

        VrpRoute route;
        if (vrpResult.Routes.Count > 0)
        {
            var solvedRoute = vrpResult.Routes[0];
            // Restore original vehicle IDs in the route
            route = solvedRoute with
            {
                VehicleId = request.VehicleId,
                VehiclePlate = request.VehiclePlate,
                TotalWeightKg = solvedRoute.TotalWeightKg + request.CurrentWeightKg,
                TotalVolumeM3 = solvedRoute.TotalVolumeM3 + request.CurrentVolumeM3
            };
        }
        else
        {
            route = new VrpRoute(
                VehicleId: request.VehicleId,
                VehiclePlate: request.VehiclePlate,
                Stops: [],
                TotalDistanceKm: 0,
                TotalDurationMinutes: 0,
                TotalWeightKg: request.CurrentWeightKg,
                TotalVolumeM3: request.CurrentVolumeM3);
        }

        var reason = BuildReason(stopsAdded, stopsRemoved);

        _logger.LogInformation(
            "Reroute complete for vehicle {VehicleId}: {StopCount} stops, {Distance:F1} km, {Duration:F1} min",
            request.VehicleId, route.Stops.Count, route.TotalDistanceKm, route.TotalDurationMinutes);

        return new RerouteResult(
            Route: route,
            UnservedStops: vrpResult.UnservedStops,
            TotalDistanceKm: route.TotalDistanceKm,
            TotalDurationMinutes: route.TotalDurationMinutes,
            StopsAdded: stopsAdded,
            StopsRemoved: stopsRemoved,
            Reason: reason);
    }

    private static string BuildReason(int added, int removed)
    {
        var parts = new List<string>();
        if (added > 0) parts.Add($"{added} new stop(s) added");
        if (removed > 0) parts.Add($"{removed} stop(s) cancelled");
        if (parts.Count == 0) parts.Add("Re-optimized remaining stops");
        return string.Join(", ", parts);
    }
}
