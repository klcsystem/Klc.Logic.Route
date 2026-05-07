namespace Klc.LogicRoute.Application.Simulation.Models;

public record DigitalTwinSnapshot(
    int ActiveVehicles,
    int TotalDrivers,
    int DailyShipments,
    int ActiveShipments,
    decimal AverageCostPerShipment,
    decimal TotalRevenue,
    Dictionary<string, int> ProviderDistribution,
    Dictionary<string, int> StatusDistribution,
    double AverageDistanceKm,
    double AverageDurationHours,
    double Co2PerShipmentKg,
    double VehicleUtilizationPct,
    DateTime SnapshotAt);

public record SimulationModifications(
    int? VehicleCountDelta,
    double? DemandMultiplier,
    double? CostMultiplier,
    string? RemoveProvider,
    string? AddProvider,
    int? MaxShipmentsPerVehicle);
