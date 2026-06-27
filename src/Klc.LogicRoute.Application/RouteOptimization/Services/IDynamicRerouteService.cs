using Klc.LogicRoute.Application.RouteOptimization.Models;

namespace Klc.LogicRoute.Application.RouteOptimization.Services;

public interface IDynamicRerouteService
{
    /// <summary>
    /// Re-optimizes remaining stops when conditions change mid-route.
    /// Takes the vehicle's current position, remaining unvisited stops,
    /// any new stops to insert, and cancelled stop IDs.
    /// Returns an updated single-vehicle route with new stop sequence.
    /// </summary>
    Task<RerouteResult> RerouteAsync(RerouteRequest request, CancellationToken cancellationToken = default);
}

public record RerouteRequest(
    Guid VehicleId,
    string VehiclePlate,
    double CurrentLat,
    double CurrentLng,
    decimal CurrentWeightKg,
    decimal CurrentVolumeM3,
    decimal CapacityKg,
    decimal CapacityM3,
    List<VrpStop> RemainingStops,
    List<VrpStop> NewStops,
    List<Guid> CancelledShipmentIds);

public record RerouteResult(
    VrpRoute Route,
    List<VrpStop> UnservedStops,
    double TotalDistanceKm,
    double TotalDurationMinutes,
    int StopsAdded,
    int StopsRemoved,
    string Reason);
