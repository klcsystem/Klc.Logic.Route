using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
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
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Order>>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var orders = await orderRepository.GetAllAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<Order>>.Ok(orders));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<Order>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var order = await orderRepository.GetByIdAsync(id, tenantId);
        if (order == null) return NotFound(ApiResponse<Order>.Fail("Siparis bulunamadi"));
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
        if (existing == null) return NotFound(ApiResponse<bool>.Fail("Siparis bulunamadi"));

        order.Id = id;
        order.TenantId = tenantId;
        order.UpdatedBy = tenantProvider.GetUserId();
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
        if (existing == null) return NotFound(ApiResponse<bool>.Fail("Siparis bulunamadi"));

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

    [HttpGet("count")]
    public async Task<ActionResult<ApiResponse<int>>> GetCount()
    {
        var tenantId = tenantProvider.GetTenantId();
        var count = await orderRepository.GetCountAsync(tenantId);
        return Ok(ApiResponse<int>.Ok(count));
    }
}

public record OrderStatusUpdate(OrderStatus Status);
