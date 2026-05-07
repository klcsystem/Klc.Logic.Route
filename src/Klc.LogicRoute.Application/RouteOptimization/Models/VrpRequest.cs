namespace Klc.LogicRoute.Application.RouteOptimization.Models;

public record VrpRequest(
    List<VrpVehicle> Vehicles,
    List<VrpStop> Stops);

public record VrpVehicle(
    Guid Id,
    string Plate,
    decimal CapacityKg,
    decimal CapacityM3,
    double DepotLat,
    double DepotLng);

public record VrpStop(
    Guid ShipmentId,
    double Lat,
    double Lng,
    decimal WeightKg,
    decimal VolumeM3,
    DateTime? TimeWindowStart,
    DateTime? TimeWindowEnd,
    int ServiceMinutes = 15);
