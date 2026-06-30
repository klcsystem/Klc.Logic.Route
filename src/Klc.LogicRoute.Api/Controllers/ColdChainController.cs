using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/cold-chain")]
[Authorize]
public class ColdChainController(
    ITemperatureReadingRepository temperatureRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>Record temperature reading from IoT device</summary>
    [HttpPost("readings")]
    public async Task<ActionResult<ApiResponse<Guid>>> RecordReading([FromBody] TemperatureReading reading)
    {
        var tenantId = tenantProvider.GetTenantId();
        reading.TenantId = tenantId;
        reading.CreatedBy = tenantProvider.GetUserId();

        var id = await temperatureRepository.InsertAsync(reading);
        return CreatedAtAction(nameof(GetByShipment), new { shipmentId = reading.ShipmentId },
            ApiResponse<Guid>.Ok(id));
    }

    /// <summary>Get temperature readings for a shipment</summary>
    [HttpGet("readings/{shipmentId:guid}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<TemperatureReading>>>> GetByShipment(
        Guid shipmentId, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
    {
        var readings = await temperatureRepository.GetByShipmentAsync(shipmentId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<TemperatureReading>>.Ok(readings));
    }

    /// <summary>Get alarm readings (temperature out of range)</summary>
    [HttpGet("alerts")]
    public async Task<ActionResult<ApiResponse<IEnumerable<TemperatureReading>>>> GetAlerts(
        [FromQuery] DateTime? since, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var alarms = await temperatureRepository.GetAlarmsAsync(tenantId, since, page, pageSize);
        return Ok(ApiResponse<IEnumerable<TemperatureReading>>.Ok(alarms));
    }

    /// <summary>Dashboard: total monitored shipments, alarms today, avg temperature</summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<ColdChainDashboard>>> GetDashboard()
    {
        var tenantId = tenantProvider.GetTenantId();
        var (totalMonitored, alarmsToday, avgTemp) = await temperatureRepository.GetDashboardAsync(tenantId);

        return Ok(ApiResponse<ColdChainDashboard>.Ok(new ColdChainDashboard
        {
            TotalMonitoredShipments = totalMonitored,
            AlarmsToday = alarmsToday,
            AverageTemperature = avgTemp
        }));
    }
}

public class ColdChainDashboard
{
    public int TotalMonitoredShipments { get; set; }
    public int AlarmsToday { get; set; }
    public decimal AverageTemperature { get; set; }
}
