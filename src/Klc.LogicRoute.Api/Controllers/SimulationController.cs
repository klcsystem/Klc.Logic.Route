using System.Text.Json;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Simulation.Models;
using Klc.LogicRoute.Application.Simulation.Services;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Klc.LogicRoute.Api.Hubs;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/simulation")]
[Authorize]
public class SimulationController(
    ISimulationEngine simulationEngine,
    ISimulationRepository simulationRepository,
    IShipmentRepository shipmentRepository,
    ITenantProvider tenantProvider,
    IHubContext<SimulationHub> simulationHub) : ControllerBase
{
    [HttpGet("snapshot")]
    public async Task<ActionResult<ApiResponse<DigitalTwinSnapshot>>> GetSnapshot()
    {
        var tenantId = tenantProvider.GetTenantId();
        var snapshot = await simulationEngine.TakeSnapshotAsync(tenantId);
        return Ok(ApiResponse<DigitalTwinSnapshot>.Ok(snapshot));
    }

    [HttpGet("current")]
    public async Task<ActionResult<ApiResponse<SimulationMetrics>>> GetCurrentMetrics()
    {
        var tenantId = tenantProvider.GetTenantId();
        var snapshot = await simulationEngine.TakeSnapshotAsync(tenantId);

        // Gercek zamaninda-teslim orani: teslim edilmis sevkiyatlarda
        // actual_delivery_date <= requested_delivery_date olanlarin yuzdesi.
        var shipments = await shipmentRepository.GetAllAsync(tenantId, 1, 500);
        var delivered = shipments
            .Where(s => s.Status >= ShipmentStatus.Delivered
                        && s.ActualDeliveryDate.HasValue
                        && s.RequestedDeliveryDate.HasValue)
            .ToList();
        double onTimePct = delivered.Count > 0
            ? Math.Round(
                delivered.Count(s => s.ActualDeliveryDate!.Value <= s.RequestedDeliveryDate!.Value)
                    * 100.0 / delivered.Count, 1)
            // Teslim gecmisi yoksa: arac doluluguna gore model tahmini (SimulationEngine ile ayni egilim)
            : snapshot.VehicleUtilizationPct > 85 ? 70.0 : snapshot.VehicleUtilizationPct > 70 ? 85.0 : 95.0;

        var active = snapshot.ActiveShipments;
        var fleet = Math.Max(1, snapshot.ActiveVehicles);
        var metrics = new SimulationMetrics(
            TotalCost: Math.Round(snapshot.AverageCostPerShipment * active, 2),
            TotalDistanceKm: Math.Round(snapshot.AverageDistanceKm * active, 1),
            // Filo paralel calistigi icin toplam sure aktif arac sayisina bolunur (engine ile tutarli).
            TotalDurationMin: Math.Round(active * snapshot.AverageDurationHours / fleet * 60, 1),
            Co2EmissionsKg: Math.Round(snapshot.Co2PerShipmentKg * active, 1),
            VehicleUtilizationPercent: snapshot.VehicleUtilizationPct,
            AvgDeliveryTimeHours: Math.Round(snapshot.AverageDurationHours, 1),
            OnTimeDeliveryPercent: onTimePct,
            ActiveVehicles: snapshot.ActiveVehicles,
            ActiveShipments: snapshot.ActiveShipments);

        return Ok(ApiResponse<SimulationMetrics>.Ok(metrics));
    }

    [HttpPost("scenarios")]
    public async Task<ActionResult<ApiResponse<SimulationScenario>>> CreateScenario([FromBody] CreateScenarioRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();

        // Take snapshot as baseline
        var snapshot = await simulationEngine.TakeSnapshotAsync(tenantId);

        var scenario = new SimulationScenario
        {
            TenantId = tenantId,
            Name = request.Name,
            Description = request.Description,
            BaseSnapshot = JsonSerializer.Serialize(snapshot),
            Modifications = request.Modifications != null ? JsonSerializer.Serialize(request.Modifications) : null,
            Status = "Draft",
            CreatedBy = userId
        };

        await simulationRepository.CreateScenarioAsync(scenario);
        return CreatedAtAction(nameof(GetScenarioResult), new { id = scenario.Id },
            ApiResponse<SimulationScenario>.Ok(scenario));
    }

    [HttpPost("scenarios/{id:guid}/run")]
    public async Task<ActionResult<ApiResponse<SimulationResult>>> RunScenario(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var scenario = await simulationRepository.GetScenarioByIdAsync(id, tenantId);
        if (scenario == null)
            return NotFound(ApiResponse<SimulationResult>.Fail("Senaryo bulunamadı"));

        scenario.Status = "Running";
        scenario.UpdatedAt = DateTime.UtcNow;
        await simulationRepository.UpdateScenarioAsync(scenario);

        // Notify via SignalR
        await simulationHub.Clients.Group($"simulation-{id}")
            .SendAsync("SimulationProgress", new { scenarioId = id, status = "Running", progress = 0 });

        SimulationResult result;
        try
        {
            result = await simulationEngine.RunSimulationAsync(scenario, tenantId);
            result.CreatedBy = tenantProvider.GetUserId();
            await simulationRepository.CreateResultAsync(result);

            scenario.Status = "Completed";
            scenario.UpdatedAt = DateTime.UtcNow;
            await simulationRepository.UpdateScenarioAsync(scenario);

            await simulationHub.Clients.Group($"simulation-{id}")
                .SendAsync("SimulationProgress", new { scenarioId = id, status = "Completed", progress = 100 });
        }
        catch (Exception ex)
        {
            scenario.Status = "Failed";
            scenario.UpdatedAt = DateTime.UtcNow;
            await simulationRepository.UpdateScenarioAsync(scenario);

            await simulationHub.Clients.Group($"simulation-{id}")
                .SendAsync("SimulationProgress", new { scenarioId = id, status = "Failed", error = ex.Message });

            return BadRequest(ApiResponse<SimulationResult>.Fail($"Simülasyon başarısız: {ex.Message}"));
        }

        return Ok(ApiResponse<SimulationResult>.Ok(result));
    }

    [HttpGet("scenarios/{id:guid}/result")]
    public async Task<ActionResult<ApiResponse<SimulationResult>>> GetScenarioResult(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await simulationRepository.GetResultByScenarioIdAsync(id, tenantId);
        if (result == null)
            return NotFound(ApiResponse<SimulationResult>.Fail("Sonuç bulunamadı"));
        return Ok(ApiResponse<SimulationResult>.Ok(result));
    }

    [HttpGet("compare")]
    public async Task<ActionResult<ApiResponse<List<SimulationResult>>>> Compare([FromQuery] string ids)
    {
        var tenantId = tenantProvider.GetTenantId();
        var scenarioIds = ids.Split(',').Select(Guid.Parse).ToList();
        var results = new List<SimulationResult>();

        foreach (var scenarioId in scenarioIds)
        {
            var result = await simulationRepository.GetResultByScenarioIdAsync(scenarioId, tenantId);
            if (result != null)
                results.Add(result);
        }

        return Ok(ApiResponse<List<SimulationResult>>.Ok(results));
    }
}

public record CreateScenarioRequest(string Name, string? Description, SimulationModifications? Modifications);
