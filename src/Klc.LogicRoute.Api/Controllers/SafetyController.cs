using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Safety;
using Klc.LogicRoute.Application.Safety.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/safety")]
[Authorize]
public class SafetyController(
    IDriverWellnessService driverWellnessService,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet("driver/{id:guid}/wellness")]
    public async Task<ActionResult<ApiResponse<WellnessReport>>> GetDriverWellness(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();

        try
        {
            var result = await driverWellnessService.GetWellnessAsync(id, tenantId);
            return Ok(ApiResponse<WellnessReport>.Ok(result));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<WellnessReport>.Fail(ex.Message));
        }
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<ApiResponse<List<SafetyAlert>>>> GetAlerts()
    {
        var tenantId = tenantProvider.GetTenantId();
        var alerts = await driverWellnessService.GetActiveAlertsAsync(tenantId);
        return Ok(ApiResponse<List<SafetyAlert>>.Ok(alerts));
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<SafetyDashboard>>> GetDashboard()
    {
        var tenantId = tenantProvider.GetTenantId();
        var dashboard = await driverWellnessService.GetDashboardAsync(tenantId);
        return Ok(ApiResponse<SafetyDashboard>.Ok(dashboard));
    }
}
