using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/provider-portal")]
[Authorize]
public class ProviderPortalController(
    IProviderPortalRepository providerPortalRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet("orders")]
    public async Task<ActionResult<ApiResponse<IEnumerable<Order>>>> GetOrders(
        [FromQuery] Guid providerId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var orders = await providerPortalRepository.GetOrdersByProviderAsync(tenantId, providerId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<Order>>.Ok(orders));
    }

    [HttpGet("vehicles")]
    public async Task<ActionResult<ApiResponse<IEnumerable<Vehicle>>>> GetVehicles([FromQuery] Guid providerId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var vehicles = await providerPortalRepository.GetVehiclesByProviderAsync(tenantId, providerId);
        return Ok(ApiResponse<IEnumerable<Vehicle>>.Ok(vehicles));
    }

    [HttpGet("drivers")]
    public async Task<ActionResult<ApiResponse<IEnumerable<Driver>>>> GetDrivers([FromQuery] Guid providerId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var drivers = await providerPortalRepository.GetDriversByProviderAsync(tenantId, providerId);
        return Ok(ApiResponse<IEnumerable<Driver>>.Ok(drivers));
    }

    [HttpGet("shipments")]
    public async Task<ActionResult<ApiResponse<IEnumerable<Shipment>>>> GetShipments(
        [FromQuery] Guid providerId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipments = await providerPortalRepository.GetShipmentsByProviderAsync(tenantId, providerId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<Shipment>>.Ok(shipments));
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<ProviderPortalStats>>> GetStats([FromQuery] Guid providerId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var stats = await providerPortalRepository.GetStatsAsync(tenantId, providerId);
        return Ok(ApiResponse<ProviderPortalStats>.Ok(stats));
    }
}
