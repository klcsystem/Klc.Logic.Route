using System.Text.Json;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Simulation.Models;
using Klc.LogicRoute.Application.Simulation.Services;
using Klc.LogicRoute.Domain.Entities;
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
