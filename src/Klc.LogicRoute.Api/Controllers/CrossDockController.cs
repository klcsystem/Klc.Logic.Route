using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/cross-dock")]
[Authorize]
public class CrossDockController(
    ICrossDockRepository crossDockRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>Plan a cross-dock operation</summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] CrossDockOperation operation)
    {
        var tenantId = tenantProvider.GetTenantId();
        operation.TenantId = tenantId;
        operation.CreatedBy = tenantProvider.GetUserId();
        operation.Status = CrossDockStatus.Planned;

        var id = await crossDockRepository.InsertAsync(operation);
        return CreatedAtAction(nameof(List), null, ApiResponse<Guid>.Ok(id));
    }

    /// <summary>List cross-dock operations</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<CrossDockOperation>>>> List(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var operations = await crossDockRepository.GetByTenantAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<CrossDockOperation>>.Ok(operations));
    }

    /// <summary>Update cross-dock operation status</summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var existing = await crossDockRepository.GetByIdAsync(id);
        if (existing == null)
            return NotFound(ApiResponse<bool>.Fail("Cross-dock operasyonu bulunamadı"));

        await crossDockRepository.UpdateStatusAsync(id, request.Status);
        return Ok(ApiResponse<bool>.Ok(true, "Status güncellendi"));
    }

    /// <summary>List available hub locations (distinct hubs from operations)</summary>
    [HttpGet("hubs")]
    public async Task<ActionResult<ApiResponse<IEnumerable<HubInfo>>>> GetHubs()
    {
        var tenantId = tenantProvider.GetTenantId();
        var operations = await crossDockRepository.GetByTenantAsync(tenantId, 1, 500);
        var hubs = operations
            .GroupBy(o => o.HubName)
            .Select(g => new HubInfo
            {
                HubName = g.Key,
                Lat = g.First().HubLat,
                Lng = g.First().HubLng,
                OperationCount = g.Count()
            })
            .ToList();

        return Ok(ApiResponse<IEnumerable<HubInfo>>.Ok(hubs));
    }
}

public record UpdateStatusRequest(int Status);

public class HubInfo
{
    public string HubName { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }
    public int OperationCount { get; set; }
}
