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
        if (performance == null) return NotFound(ApiResponse<CarrierPerformance>.Fail("Performans verisi bulunamadı"));
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
        if (shipment == null) return NotFound(ApiResponse<CO2Result>.Fail("Sevkiyat bulunamadı"));

        var result = co2CalculationService.Calculate(
            0m, shipment.TotalWeightKg, shipment.RecommendedVehicle);
        return Ok(ApiResponse<CO2Result>.Ok(result));
    }

    /// <summary>OTIF (On-Time In-Full) raporu — teslim edilen sevkiyatlardan zamanında + eksiksiz teslimat oranı,
    /// varış şehri ve ay bazında kırılımla. Optiyol B2B mikro-dağıtım parite kalemidir.</summary>
    [HttpGet("otif")]
    public async Task<ActionResult<ApiResponse<object>>> GetOtif()
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipments = await shipmentRepository.GetAllAsync(tenantId, 1, 2000);
        var delivered = shipments
            .Where(s => (s.Status == ShipmentStatus.Delivered || s.Status == ShipmentStatus.Completed) && s.ActualDeliveryDate.HasValue)
            .ToList();

        static bool OnTime(Shipment s) =>
            !s.RequestedDeliveryDate.HasValue || s.ActualDeliveryDate!.Value.Date <= s.RequestedDeliveryDate.Value.Date;

        var total = delivered.Count;
        var onTimeCount = delivered.Count(OnTime);
        // Kısmi teslimat izlenmediğinden teslim edilen = "eksiksiz" kabul; OTIF ≈ zamanında oranı.
        var pct = (int n) => total > 0 ? Math.Round(n * 100.0 / total, 1) : 0.0;

        var byDestination = delivered
            .GroupBy(s => string.IsNullOrWhiteSpace(s.DestinationCity) ? "—" : s.DestinationCity!)
            .Select(g => new { city = g.Key, total = g.Count(), otifPercent = Math.Round(g.Count(OnTime) * 100.0 / g.Count(), 1) })
            .OrderByDescending(x => x.total).Take(12).ToList();

        var byMonth = delivered
            .GroupBy(s => new { s.ActualDeliveryDate!.Value.Year, s.ActualDeliveryDate!.Value.Month })
            .Select(g => new { period = $"{g.Key.Year}-{g.Key.Month:00}", total = g.Count(), otifPercent = Math.Round(g.Count(OnTime) * 100.0 / g.Count(), 1) })
            .OrderBy(x => x.period).ToList();

        return Ok(ApiResponse<object>.Ok(new
        {
            totalDelivered = total,
            onTimePercent = pct(onTimeCount),
            inFullPercent = pct(total),          // kısmi teslimat izlenmiyor → teslim edilenler tam kabul
            otifPercent = pct(onTimeCount),      // OTIF = zamanında ∧ eksiksiz
            lateCount = total - onTimeCount,
            byDestination,
            byMonth,
        }));
    }
}

public record CO2CalculateRequest(decimal DistanceKm, decimal WeightKg, VehicleCategory VehicleCategory);
