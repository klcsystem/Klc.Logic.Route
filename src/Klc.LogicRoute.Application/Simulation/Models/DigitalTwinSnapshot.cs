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

// Anlik operasyon metrikleri (frontend simulation.ts -> SimulationMetrics ile birebir).
// DigitalTwinSnapshot'tan turetilir; onTimeDeliveryPercent gercek teslim verisinden hesaplanir.
public record SimulationMetrics(
    decimal TotalCost,
    double TotalDistanceKm,
    double TotalDurationMin,
    double Co2EmissionsKg,
    double VehicleUtilizationPercent,
    double AvgDeliveryTimeHours,
    double OnTimeDeliveryPercent,
    int ActiveVehicles,
    int ActiveShipments);

public record SimulationModifications(
    int? VehicleCountDelta,
    double? DemandMultiplier,
    double? CostMultiplier,
    string? RemoveProvider,
    string? AddProvider,
    int? MaxShipmentsPerVehicle);
