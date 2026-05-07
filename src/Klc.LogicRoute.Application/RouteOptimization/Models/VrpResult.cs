namespace Klc.LogicRoute.Application.RouteOptimization.Models;

public record VrpResult(
    List<VrpRoute> Routes,
    double TotalDistance,
    double TotalDuration,
    List<VrpStop> UnservedStops);

public record VrpRoute(
    Guid VehicleId,
    string VehiclePlate,
    List<VrpRouteStop> Stops,
    double TotalDistanceKm,
    double TotalDurationMinutes,
    decimal TotalWeightKg,
    decimal TotalVolumeM3);

public record VrpRouteStop(
    Guid ShipmentId,
    int Order,
    double Lat,
    double Lng,
    double DistanceFromPrevKm,
    double DurationFromPrevMinutes,
    DateTime? EstimatedArrival,
    DateTime? EstimatedDeparture);
