using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Sustainability;
using Klc.LogicRoute.Application.Sustainability.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SustainabilityController(
    ICarbonCreditService carbonCreditService,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>Carbon report — monthly or yearly</summary>
    [HttpGet("carbon-report")]
    public async Task<ActionResult<ApiResponse<CarbonReport>>> GetCarbonReport(
        [FromQuery] string period = "monthly",
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        var tenantId = tenantProvider.GetTenantId();
        var reportYear = year ?? DateTime.UtcNow.Year;
        var reportMonth = month ?? DateTime.UtcNow.Month;

        var report = await carbonCreditService.GetCarbonReportAsync(tenantId, period, reportYear, reportMonth);
        return Ok(ApiResponse<CarbonReport>.Ok(report));
    }

    /// <summary>ESG report — yearly</summary>
    [HttpGet("esg-report")]
    public async Task<ActionResult<ApiResponse<EsgReport>>> GetEsgReport([FromQuery] int? year = null)
    {
        var tenantId = tenantProvider.GetTenantId();
        var reportYear = year ?? DateTime.UtcNow.Year;

        var report = await carbonCreditService.GetEsgReportAsync(tenantId, reportYear);
        return Ok(ApiResponse<EsgReport>.Ok(report));
    }

    /// <summary>Quick savings overview</summary>
    [HttpGet("savings-summary")]
    public async Task<ActionResult<ApiResponse<SavingsSummary>>> GetSavingsSummary()
    {
        var tenantId = tenantProvider.GetTenantId();
        var summary = await carbonCreditService.GetSavingsSummaryAsync(tenantId);
        return Ok(ApiResponse<SavingsSummary>.Ok(summary));
    }
}
