using Klc.LogicRoute.Application.CargoCalculation;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.DecisionEngine;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CargoController(
    IOrderRepository orderRepository,
    ICargoDetailRepository cargoDetailRepository,
    ICargoCalculationService cargoCalculationService,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpPost("calculate/{orderId:guid}")]
    public async Task<ActionResult<ApiResponse<CargoDetail>>> Calculate(Guid orderId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var order = await orderRepository.GetByIdAsync(orderId, tenantId);
        if (order == null) return NotFound(ApiResponse<CargoDetail>.Fail("Sipariş bulunamadı"));

        var cargoDetail = cargoCalculationService.Calculate(order);
        cargoDetail.CreatedBy = tenantProvider.GetUserId();

        var existing = await cargoDetailRepository.GetByOrderIdAsync(orderId, tenantId);
        if (existing != null)
            await cargoDetailRepository.UpdateAsync(cargoDetail);
        else
            await cargoDetailRepository.InsertAsync(cargoDetail);

        return Ok(ApiResponse<CargoDetail>.Ok(cargoDetail));
    }

    [HttpGet("detail/{orderId:guid}")]
    public async Task<ActionResult<ApiResponse<CargoDetail>>> GetDetail(Guid orderId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var detail = await cargoDetailRepository.GetByOrderIdAsync(orderId, tenantId);
        if (detail == null) return NotFound(ApiResponse<CargoDetail>.Fail("Kargo detayı bulunamadı"));
        return Ok(ApiResponse<CargoDetail>.Ok(detail));
    }
}
