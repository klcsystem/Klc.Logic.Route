using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController(
    IErpConnectionRepository erpConnectionRepository,
    IEnumerable<IErpAdapter> erpAdapters,
    IOrderRepository orderRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet("erp-connections")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ErpConnection>>>> GetErpConnections()
    {
        var tenantId = tenantProvider.GetTenantId();
        var connections = await erpConnectionRepository.GetAllAsync(tenantId);
        return Ok(ApiResponse<IEnumerable<ErpConnection>>.Ok(connections));
    }

    [HttpGet("erp-connections/{id:guid}")]
    public async Task<ActionResult<ApiResponse<ErpConnection>>> GetErpConnection(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var connection = await erpConnectionRepository.GetByIdAsync(id, tenantId);
        if (connection == null) return NotFound(ApiResponse<ErpConnection>.Fail("ERP baglantisi bulunamadi"));
        return Ok(ApiResponse<ErpConnection>.Ok(connection));
    }

    [HttpPost("erp-connections")]
    public async Task<ActionResult<ApiResponse<Guid>>> CreateErpConnection([FromBody] ErpConnection connection)
    {
        var tenantId = tenantProvider.GetTenantId();
        connection.TenantId = tenantId;
        connection.CreatedBy = tenantProvider.GetUserId();
        var id = await erpConnectionRepository.InsertAsync(connection);
        return CreatedAtAction(nameof(GetErpConnection), new { id }, ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("erp-connections/{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateErpConnection(Guid id, [FromBody] ErpConnection connection)
    {
        var tenantId = tenantProvider.GetTenantId();
        connection.Id = id;
        connection.TenantId = tenantId;
        connection.UpdatedBy = tenantProvider.GetUserId();
        await erpConnectionRepository.UpdateAsync(connection);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpDelete("erp-connections/{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteErpConnection(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        await erpConnectionRepository.DeleteAsync(id, tenantId);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpPost("erp-connections/{id:guid}/test")]
    public async Task<ActionResult<ApiResponse<bool>>> TestErpConnection(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var connection = await erpConnectionRepository.GetByIdAsync(id, tenantId);
        if (connection == null) return NotFound(ApiResponse<bool>.Fail("ERP baglantisi bulunamadi"));

        var adapter = erpAdapters.FirstOrDefault(a => a.SupportedType == connection.ErpType)
            ?? erpAdapters.First(a => a.SupportedType == Domain.Enums.ErpType.Generic);

        var result = await adapter.TestConnectionAsync(connection);
        await erpConnectionRepository.UpdateSyncStatusAsync(id, tenantId, result ? "Connected" : "Failed");
        return Ok(ApiResponse<bool>.Ok(result));
    }

    [HttpPost("erp-connections/{id:guid}/sync")]
    public async Task<ActionResult<ApiResponse<int>>> SyncErpOrders(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var connection = await erpConnectionRepository.GetByIdAsync(id, tenantId);
        if (connection == null) return NotFound(ApiResponse<int>.Fail("ERP baglantisi bulunamadi"));

        var adapter = erpAdapters.FirstOrDefault(a => a.SupportedType == connection.ErpType)
            ?? erpAdapters.First(a => a.SupportedType == Domain.Enums.ErpType.Generic);

        var orders = await adapter.SyncOrdersAsync(connection, connection.LastSyncAt);

        foreach (var order in orders)
        {
            order.TenantId = tenantId;
            order.CreatedBy = tenantProvider.GetUserId();
            await orderRepository.InsertAsync(order);
        }

        await erpConnectionRepository.UpdateSyncStatusAsync(id, tenantId, $"Synced {orders.Count} orders");
        return Ok(ApiResponse<int>.Ok(orders.Count, $"{orders.Count} siparis senkronize edildi"));
    }
}
