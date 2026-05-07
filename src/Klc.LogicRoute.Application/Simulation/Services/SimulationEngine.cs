using System.Text.Json;
using Klc.LogicRoute.Application.Simulation.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Simulation.Services;

public class SimulationEngine(
    IShipmentRepository shipmentRepository,
    IVehicleRepository vehicleRepository,
    IDriverRepository driverRepository,
    IProviderRepository providerRepository,
    ILogger<SimulationEngine> logger) : ISimulationEngine
{
    public async Task<DigitalTwinSnapshot> TakeSnapshotAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var shipments = (await shipmentRepository.GetAllAsync(tenantId, 1, 500)).ToList();
        var vehicles = await vehicleRepository.GetAllAsync(tenantId);
        var drivers = await driverRepository.GetAllAsync(tenantId);
        var providers = await providerRepository.GetAllAsync(tenantId);

        var activeShipments = shipments.Where(s => s.Status >= ShipmentStatus.SentToProvider && s.Status < ShipmentStatus.Completed).ToList();
        var completedShipments = shipments.Where(s => s.Status >= ShipmentStatus.Delivered).ToList();

        var avgCost = completedShipments.Any(s => s.CalculatedPrice > 0)
            ? completedShipments.Where(s => s.CalculatedPrice > 0).Average(s => s.CalculatedPrice!.Value)
            : 0m;

        var providerDist = shipments
            .Where(s => s.SelectedProviderId.HasValue)
            .GroupBy(s => providers.FirstOrDefault(p => p.Id == s.SelectedProviderId)?.Name ?? "Bilinmiyor")
            .ToDictionary(g => g.Key, g => g.Count());

        var statusDist = shipments
            .GroupBy(s => s.Status.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var activeVehicles = vehicles.Count(v => v.IsActive);
        var totalDrivers = drivers.Count(d => d.IsActive);
        var dailyShipments = shipments.Count(s => s.CreatedAt.Date == DateTime.UtcNow.Date);

        // Rough metrics
        var avgDistanceKm = completedShipments.Count > 0 ? 250.0 : 0; // placeholder
        var avgDurationHours = completedShipments.Count > 0 ? 12.0 : 0;
        var co2PerShipment = avgDistanceKm * 0.12; // ~120g CO2/km for truck
        var vehicleUtilization = activeVehicles > 0 ? (double)activeShipments.Count / activeVehicles * 100 : 0;

        return new DigitalTwinSnapshot(
            ActiveVehicles: activeVehicles,
            TotalDrivers: totalDrivers,
            DailyShipments: dailyShipments,
            ActiveShipments: activeShipments.Count,
            AverageCostPerShipment: Math.Round(avgCost, 2),
            TotalRevenue: completedShipments.Sum(s => s.CalculatedPrice ?? 0),
            ProviderDistribution: providerDist,
            StatusDistribution: statusDist,
            AverageDistanceKm: avgDistanceKm,
            AverageDurationHours: avgDurationHours,
            Co2PerShipmentKg: co2PerShipment,
            VehicleUtilizationPct: Math.Round(vehicleUtilization, 1),
            SnapshotAt: DateTime.UtcNow);
    }

    public async Task<SimulationResult> RunSimulationAsync(SimulationScenario scenario, Guid tenantId, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Running simulation for scenario {ScenarioId}", scenario.Id);

        // Take current snapshot as baseline
        var snapshot = await TakeSnapshotAsync(tenantId, cancellationToken);

        // Parse modifications
        var mods = !string.IsNullOrEmpty(scenario.Modifications)
            ? JsonSerializer.Deserialize<SimulationModifications>(scenario.Modifications,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            : null;

        // Apply modifications to simulate impact
        var simVehicles = snapshot.ActiveVehicles + (mods?.VehicleCountDelta ?? 0);
        simVehicles = Math.Max(1, simVehicles);

        var demandMultiplier = mods?.DemandMultiplier ?? 1.0;
        var costMultiplier = mods?.CostMultiplier ?? 1.0;

        var simDailyShipments = (int)(snapshot.DailyShipments * demandMultiplier);
        var simCostPerShipment = snapshot.AverageCostPerShipment * (decimal)costMultiplier;
        var simTotalCost = simCostPerShipment * simDailyShipments;

        // Vehicle capacity analysis
        var maxShipmentsPerVehicle = mods?.MaxShipmentsPerVehicle ?? 8;
        var vehicleCapacity = simVehicles * maxShipmentsPerVehicle;
        var unserved = Math.Max(0, simDailyShipments - vehicleCapacity);

        // Utilization
        var utilization = vehicleCapacity > 0 ? (double)simDailyShipments / vehicleCapacity * 100 : 0;
        utilization = Math.Min(utilization, 100);

        // On-time prediction (decreases with higher utilization)
        var onTimePct = utilization > 85 ? 70.0 : utilization > 70 ? 85.0 : 95.0;

        // Distance and CO2
        var totalDistanceKm = simDailyShipments * snapshot.AverageDistanceKm;
        var totalDurationHours = simDailyShipments * snapshot.AverageDurationHours / simVehicles;
        var co2Total = totalDistanceKm * 0.12;

        // Cost delta
        var baselineCost = (double)(snapshot.AverageCostPerShipment * snapshot.DailyShipments);
        var costDelta = baselineCost > 0 ? ((double)simTotalCost - baselineCost) / baselineCost * 100 : 0;

        var details = JsonSerializer.Serialize(new
        {
            Baseline = new { snapshot.ActiveVehicles, snapshot.DailyShipments, snapshot.AverageCostPerShipment },
            Simulated = new { Vehicles = simVehicles, DailyShipments = simDailyShipments, CostPerShipment = simCostPerShipment },
            Modifications = mods
        });

        return new SimulationResult
        {
            TenantId = tenantId,
            ScenarioId = scenario.Id,
            TotalCost = simTotalCost,
            TotalDistanceKm = totalDistanceKm,
            TotalDurationHours = totalDurationHours,
            VehicleUtilizationPct = Math.Round(utilization, 1),
            OnTimePredictionPct = onTimePct,
            Co2TotalKg = Math.Round(co2Total, 2),
            UnservedShipments = unserved,
            CostDeltaPct = Math.Round(costDelta, 1),
            Details = details
        };
    }
}
