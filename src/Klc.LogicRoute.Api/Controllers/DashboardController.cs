using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController(
    IDashboardRepository dashboardRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<DashboardSummary>>> GetSummary()
    {
        var tenantId = tenantProvider.GetTenantId();
        var summary = new DashboardSummary
        {
            TotalOrders = await dashboardRepository.GetOrderCountAsync(tenantId),
            PendingOrders = await dashboardRepository.GetOrderCountAsync(tenantId, 1),
            TotalShipments = await dashboardRepository.GetShipmentCountAsync(tenantId),
            InTransitShipments = await dashboardRepository.GetShipmentCountAsync(tenantId, 4),
            DeliveredShipments = await dashboardRepository.GetShipmentCountAsync(tenantId, 6),
            ActiveProviders = await dashboardRepository.GetProviderCountAsync(tenantId),
            ActiveContracts = await dashboardRepository.GetActiveContractCountAsync(tenantId),
            TotalCostThisMonth = await dashboardRepository.GetTotalShipmentCostAsync(tenantId, DateTime.UtcNow.Year, DateTime.UtcNow.Month),
            AverageDeliveryHours = await dashboardRepository.GetAverageDeliveryHoursAsync(tenantId)
        };
        return Ok(ApiResponse<DashboardSummary>.Ok(summary));
    }

    [HttpGet("monthly-costs")]
    public async Task<ActionResult<ApiResponse<IEnumerable<MonthlyCostSummary>>>> GetMonthlyCosts([FromQuery] int? year)
    {
        var tenantId = tenantProvider.GetTenantId();
        var costs = await dashboardRepository.GetMonthlyCostsAsync(tenantId, year ?? DateTime.UtcNow.Year);
        return Ok(ApiResponse<IEnumerable<MonthlyCostSummary>>.Ok(costs));
    }

    [HttpGet("provider-costs")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProviderCostSummary>>>> GetProviderCosts([FromQuery] int? year, [FromQuery] int? month)
    {
        var tenantId = tenantProvider.GetTenantId();
        var costs = await dashboardRepository.GetProviderCostsAsync(tenantId, year, month);
        return Ok(ApiResponse<IEnumerable<ProviderCostSummary>>.Ok(costs));
    }
}

public class DashboardSummary
{
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int TotalShipments { get; set; }
    public int InTransitShipments { get; set; }
    public int DeliveredShipments { get; set; }
    public int ActiveProviders { get; set; }
    public int ActiveContracts { get; set; }
    public decimal TotalCostThisMonth { get; set; }
    public decimal AverageDeliveryHours { get; set; }
}
