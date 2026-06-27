using Klc.LogicRoute.Application.Analytics;
using Klc.LogicRoute.Application.Analytics.Models;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController(
    IDemandForecastService demandForecastService,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet("demand-forecast")]
    public async Task<ActionResult<ApiResponse<DemandForecastResult>>> GetDemandForecast(
        [FromQuery] int days = 7)
    {
        if (days is < 1 or > 30)
            return BadRequest(ApiResponse<DemandForecastResult>.Fail("days parametresi 1-30 arasinda olmalidir."));

        var tenantId = tenantProvider.GetTenantId();
        var result = await demandForecastService.ForecastAsync(tenantId, days);
        return Ok(ApiResponse<DemandForecastResult>.Ok(result));
    }

    [HttpGet("demand-by-region")]
    public async Task<ActionResult<ApiResponse<IEnumerable<RegionDemand>>>> GetDemandByRegion(
        [FromQuery] int lookbackDays = 30)
    {
        if (lookbackDays is < 1 or > 365)
            return BadRequest(ApiResponse<IEnumerable<RegionDemand>>.Fail("lookbackDays parametresi 1-365 arasinda olmalidir."));

        var tenantId = tenantProvider.GetTenantId();
        var result = await demandForecastService.GetDemandByRegionAsync(tenantId, lookbackDays);
        return Ok(ApiResponse<IEnumerable<RegionDemand>>.Ok(result));
    }
}
