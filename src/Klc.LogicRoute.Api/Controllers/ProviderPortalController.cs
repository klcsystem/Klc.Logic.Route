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

    // ── Tarife (arac-tipi + KM-araligi bazli) ──
    [HttpGet("tariff")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProviderTariffRow>>>> GetTariff(
        [FromQuery] string? vehicleType, [FromQuery] Guid providerId = default)
    {
        var tenantId = tenantProvider.GetTenantId();
        var pid = await providerPortalRepository.ResolveProviderIdAsync(tenantId, providerId);
        var vt = string.IsNullOrWhiteSpace(vehicleType) ? "Tır" : vehicleType;
        var rows = await providerPortalRepository.GetTariffAsync(tenantId, pid, vt);
        return Ok(ApiResponse<IEnumerable<ProviderTariffRow>>.Ok(rows));
    }

    [HttpPut("tariff")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveTariff(
        [FromBody] SaveTariffRequest request, [FromQuery] Guid providerId = default)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();
        var pid = await providerPortalRepository.ResolveProviderIdAsync(tenantId, providerId);
        await providerPortalRepository.SaveTariffAsync(
            tenantId, pid, request.VehicleType, request.Rows ?? [], userId);
        return Ok(ApiResponse<bool>.Ok(true, "Tarife kaydedildi"));
    }

    // ── Portal kullanicilari (CRUD) ──
    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProviderUser>>>> GetUsers([FromQuery] Guid providerId = default)
    {
        var tenantId = tenantProvider.GetTenantId();
        var pid = await providerPortalRepository.ResolveProviderIdAsync(tenantId, providerId);
        var users = await providerPortalRepository.GetUsersAsync(tenantId, pid);
        return Ok(ApiResponse<IEnumerable<ProviderUser>>.Ok(users));
    }

    [HttpPost("users")]
    public async Task<ActionResult<ApiResponse<ProviderUser>>> CreateUser(
        [FromBody] ProviderUserRequest request, [FromQuery] Guid providerId = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(ApiResponse<ProviderUser>.Fail("Ad ve e-posta zorunludur"));

        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();
        var pid = await providerPortalRepository.ResolveProviderIdAsync(tenantId, providerId);
        var created = await providerPortalRepository.CreateUserAsync(
            tenantId, pid, request.Name, request.Email,
            string.IsNullOrWhiteSpace(request.Role) ? "ProviderDriver" : request.Role,
            request.Active ?? true, userId);
        return Ok(ApiResponse<ProviderUser>.Ok(created));
    }

    [HttpPut("users/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProviderUser>>> UpdateUser(
        Guid id, [FromBody] ProviderUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(ApiResponse<ProviderUser>.Fail("Ad ve e-posta zorunludur"));

        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();
        var updated = await providerPortalRepository.UpdateUserAsync(
            tenantId, id, request.Name, request.Email,
            string.IsNullOrWhiteSpace(request.Role) ? "ProviderDriver" : request.Role,
            request.Active ?? true, userId);
        if (updated == null)
            return NotFound(ApiResponse<ProviderUser>.Fail("Kullanıcı bulunamadı"));
        return Ok(ApiResponse<ProviderUser>.Ok(updated));
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteUser(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();
        await providerPortalRepository.DeleteUserAsync(tenantId, id, userId);
        return Ok(ApiResponse<bool>.Ok(true, "Kullanıcı silindi"));
    }
}

public record SaveTariffRequest(string VehicleType, List<ProviderTariffRow>? Rows);

public record ProviderUserRequest(string Name, string Email, string Role, bool? Active);
