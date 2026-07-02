using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Geocoding;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController(
    IOrderRepository orderRepository,
    IErpConnectionRepository erpConnectionRepository,
    IEnumerable<IErpAdapter> erpAdapters,
    ITenantProvider tenantProvider,
    IGeocodingService geocodingService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var orders = await orderRepository.GetAllAsync(tenantId, page, pageSize);
        var totalCount = await orderRepository.GetCountAsync(tenantId);
        var result = new
        {
            items = orders,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<Order>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var order = await orderRepository.GetByIdAsync(id, tenantId);
        if (order == null) return NotFound(ApiResponse<Order>.Fail("Sipariş bulunamadı"));
        return Ok(ApiResponse<Order>.Ok(order));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] Order order)
    {
        var tenantId = tenantProvider.GetTenantId();
        order.TenantId = tenantId;
        order.CreatedBy = tenantProvider.GetUserId();
        if (string.IsNullOrEmpty(order.OrderNumber))
            order.OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        await geocodingService.EnrichOrderCoordinatesAsync(order);

        var id = await orderRepository.InsertAsync(order);

        foreach (var line in order.Lines)
        {
            line.OrderId = id;
            line.TenantId = tenantId;
            line.CreatedBy = tenantProvider.GetUserId();
            if (line.DesiWeight == 0 && line.WidthCm > 0 && line.HeightCm > 0 && line.DepthCm > 0)
                line.DesiWeight = line.WidthCm * line.HeightCm * line.DepthCm / 3000m;
            await orderRepository.InsertLineAsync(line);
        }

        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid id, [FromBody] Order order)
    {
        var tenantId = tenantProvider.GetTenantId();
        var existing = await orderRepository.GetByIdAsync(id, tenantId);
        if (existing == null) return NotFound(ApiResponse<bool>.Fail("Sipariş bulunamadı"));

        order.Id = id;
        order.TenantId = tenantId;
        order.UpdatedBy = tenantProvider.GetUserId();
        await geocodingService.EnrichOrderCoordinatesAsync(order);
        await orderRepository.UpdateAsync(order);

        await orderRepository.DeleteLinesAsync(id);
        foreach (var line in order.Lines)
        {
            line.OrderId = id;
            line.TenantId = tenantId;
            line.CreatedBy = tenantProvider.GetUserId();
            if (line.DesiWeight == 0 && line.WidthCm > 0 && line.HeightCm > 0 && line.DepthCm > 0)
                line.DesiWeight = line.WidthCm * line.HeightCm * line.DepthCm / 3000m;
            await orderRepository.InsertLineAsync(line);
        }

        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateStatus(Guid id, [FromBody] OrderStatusUpdate update)
    {
        var tenantId = tenantProvider.GetTenantId();
        var existing = await orderRepository.GetByIdAsync(id, tenantId);
        if (existing == null) return NotFound(ApiResponse<bool>.Fail("Sipariş bulunamadı"));

        await orderRepository.UpdateStatusAsync(id, tenantId, (int)update.Status);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        await orderRepository.DeleteAsync(id, tenantId);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpPost("sync-erp")]
    public async Task<ActionResult<ApiResponse<object>>> SyncErp([FromBody] SyncErpRequest? request = null)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();

        // Find ERP connection — use specified or first active one
        ErpConnection? connection;
        if (request?.ConnectionId is not null && Guid.TryParse(request.ConnectionId, out var connId))
        {
            connection = await erpConnectionRepository.GetByIdAsync(connId, tenantId);
        }
        else
        {
            var connections = await erpConnectionRepository.GetAllAsync(tenantId);
            connection = connections.FirstOrDefault(c => c.IsActive);
        }

        if (connection == null)
            return NotFound(ApiResponse<object>.Fail("Aktif ERP bağlantısı bulunamadı"));

        var adapter = erpAdapters.FirstOrDefault(a => a.SupportedType == connection.ErpType)
                      ?? erpAdapters.FirstOrDefault(a => a.SupportedType == ErpType.Generic);

        if (adapter == null)
            return BadRequest(ApiResponse<object>.Fail("ERP adapter bulunamadı"));

        var orders = await adapter.SyncOrdersAsync(connection, connection.LastSyncAt);

        var count = 0;
        foreach (var order in orders)
        {
            order.TenantId = tenantId;
            order.CreatedBy = userId;
            await geocodingService.EnrichOrderCoordinatesAsync(order);
            await orderRepository.InsertAsync(order);
            count++;
        }

        await erpConnectionRepository.UpdateSyncStatusAsync(
            connection.Id, tenantId, $"Synced {count} orders at {DateTime.UtcNow:u}");

        return Ok(ApiResponse<object>.Ok(new { syncedCount = count }));
    }

    [HttpGet("count")]
    public async Task<ActionResult<ApiResponse<int>>> GetCount()
    {
        var tenantId = tenantProvider.GetTenantId();
        var count = await orderRepository.GetCountAsync(tenantId);
        return Ok(ApiResponse<int>.Ok(count));
    }
}

public record OrderStatusUpdate(OrderStatus Status);
public record SyncErpRequest(string? ConnectionId);
