using Klc.LogicRoute.Application.CO2;
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
public class ReportsController(
    ICarrierPerformanceRepository carrierPerformanceRepository,
    ICO2CalculationService co2CalculationService,
    IShipmentRepository shipmentRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet("carrier-performance")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CarrierPerformance>>>> GetCarrierPerformance(
        [FromQuery] int? year, [FromQuery] int? month)
    {
        var tenantId = tenantProvider.GetTenantId();
        var performances = await carrierPerformanceRepository.GetAllAsync(tenantId, year, month);
        return Ok(ApiResponse<IEnumerable<CarrierPerformance>>.Ok(performances));
    }

    [HttpGet("carrier-performance/{providerId:guid}")]
    public async Task<ActionResult<ApiResponse<CarrierPerformance>>> GetCarrierPerformanceByProvider(
        Guid providerId, [FromQuery] int year, [FromQuery] int month)
    {
        var tenantId = tenantProvider.GetTenantId();
        var performance = await carrierPerformanceRepository.GetByProviderAsync(providerId, tenantId, year, month);
        if (performance == null) return NotFound(ApiResponse<CarrierPerformance>.Fail("Performans verisi bulunamadi"));
        return Ok(ApiResponse<CarrierPerformance>.Ok(performance));
    }

    [HttpPost("co2/calculate")]
    public ActionResult<ApiResponse<CO2Result>> CalculateCO2([FromBody] CO2CalculateRequest request)
    {
        var result = co2CalculationService.Calculate(request.DistanceKm, request.WeightKg, request.VehicleCategory);
        return Ok(ApiResponse<CO2Result>.Ok(result));
    }

    [HttpGet("co2/shipment/{shipmentId:guid}")]
    public async Task<ActionResult<ApiResponse<CO2Result>>> GetShipmentCO2(Guid shipmentId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipment = await shipmentRepository.GetByIdAsync(shipmentId, tenantId);
        if (shipment == null) return NotFound(ApiResponse<CO2Result>.Fail("Sevkiyat bulunamadi"));

        var result = co2CalculationService.Calculate(
            0m, shipment.TotalWeightKg, shipment.RecommendedVehicle);
        return Ok(ApiResponse<CO2Result>.Ok(result));
    }
}

public record CO2CalculateRequest(decimal DistanceKm, decimal WeightKg, VehicleCategory VehicleCategory);
