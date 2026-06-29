using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Pipeline;
using Klc.LogicRoute.Infrastructure.BackgroundJobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/pipeline")]
[Authorize]
public class PipelineController(
    IAutoRouteService autoRouteService,
    IAutoAssignService autoAssignService,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>
    /// Manually trigger the full logistics pipeline for the current tenant.
    /// </summary>
    [HttpPost("run")]
    public ActionResult<ApiResponse<object>> RunPipeline()
    {
        var tenantId = tenantProvider.GetTenantId();
        LogisticsPipelineOrchestrator.RequestManualRun(tenantId);

        return Ok(ApiResponse<object>.Ok(new
        {
            message = "Pipeline run triggered. Check /api/pipeline/status for results.",
            tenantId = tenantId.ToString(),
            triggeredAt = DateTime.UtcNow
        }));
    }

    /// <summary>
    /// Run auto-route optimization for specific order IDs.
    /// </summary>
    [HttpPost("route")]
    public async Task<ActionResult<ApiResponse<object>>> RunAutoRoute([FromBody] AutoRouteRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();

        if (request.OrderIds is null || request.OrderIds.Count == 0)
            return BadRequest(ApiResponse<object>.Fail("OrderIds is required and must not be empty."));

        var optimizationId = await autoRouteService.OptimizeAsync(request.OrderIds, tenantId);

        return Ok(ApiResponse<object>.Ok(new
        {
            optimizationId = optimizationId.ToString(),
            orderCount = request.OrderIds.Count
        }, "Auto-route optimization completed."));
    }

    /// <summary>
    /// Run auto-assign for an existing optimization result.
    /// </summary>
    [HttpPost("assign/{optimizationId:guid}")]
    public async Task<ActionResult<ApiResponse<AutoAssignSummary>>> RunAutoAssign(Guid optimizationId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var summary = await autoAssignService.AssignAsync(optimizationId, tenantId);

        return Ok(ApiResponse<AutoAssignSummary>.Ok(summary, "Auto-assign completed."));
    }

    /// <summary>
    /// Get the last pipeline run status.
    /// </summary>
    [HttpGet("status")]
    public ActionResult<ApiResponse<PipelineStatus>> GetStatus()
    {
        var status = LogisticsPipelineOrchestrator.GetStatus();
        return Ok(ApiResponse<PipelineStatus>.Ok(status));
    }
}

public class AutoRouteRequest
{
    public List<Guid>? OrderIds { get; set; }
}
