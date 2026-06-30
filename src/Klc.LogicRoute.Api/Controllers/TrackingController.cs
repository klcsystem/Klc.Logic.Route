using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Tracking;
using Klc.LogicRoute.Application.Tracking.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrackingController(
    IDelayPredictionService delayPredictionService,
    ICacheService cacheService,
    ITenantProvider tenantProvider,
    IDriverMessageRepository driverMessageRepository) : ControllerBase
{
    /// <summary>
    /// Returns the current delay warnings for all active shipments.
    /// Checks cached results first; if none, runs a live check.
    /// </summary>
    [HttpGet("delay-alerts")]
    public async Task<ActionResult<ApiResponse<List<DelayWarning>>>> GetDelayAlerts()
    {
        // Try cached warnings first
        var cached = await cacheService.GetAsync<List<DelayWarning>>("delay_prediction:current_warnings");
        if (cached != null && cached.Count > 0)
        {
            // Filter to current tenant
            var tenantId = tenantProvider.GetTenantId();
            var filtered = cached.Where(w => w.TenantId == tenantId).ToList();
            return Ok(ApiResponse<List<DelayWarning>>.Ok(filtered));
        }

        // No cached result — run live check
        var warnings = await delayPredictionService.CheckAllActiveShipmentsAsync();
        var tenantWarnings = warnings.Where(w => w.TenantId == tenantProvider.GetTenantId()).ToList();

        return Ok(ApiResponse<List<DelayWarning>>.Ok(tenantWarnings));
    }

    /// <summary>
    /// Registers the current tenant as active for background delay monitoring.
    /// Called automatically when the tenant dashboard loads.
    /// </summary>
    [HttpPost("register-tenant")]
    public async Task<ActionResult<ApiResponse<bool>>> RegisterTenant()
    {
        var tenantId = tenantProvider.GetTenantId();
        var tenants = await cacheService.GetAsync<List<Guid>>("delay_prediction:active_tenants")
                      ?? new List<Guid>();

        if (!tenants.Contains(tenantId))
        {
            tenants.Add(tenantId);
            await cacheService.SetAsync("delay_prediction:active_tenants", tenants, TimeSpan.FromHours(24));
        }

        return Ok(ApiResponse<bool>.Ok(true, "Tenant registered for delay monitoring"));
    }

    /// <summary>
    /// Get messages for a shipment (operations view).
    /// </summary>
    [HttpGet("messages/{shipmentId:guid}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<DriverMessage>>>> GetMessages(Guid shipmentId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var messages = await driverMessageRepository.GetByShipmentIdAsync(shipmentId, tenantId);
        return Ok(ApiResponse<IEnumerable<DriverMessage>>.Ok(messages));
    }

    /// <summary>
    /// Operations sends a message to a driver for a specific shipment.
    /// </summary>
    [HttpPost("messages")]
    public async Task<ActionResult<ApiResponse<Guid>>> SendMessage([FromBody] OperationsMessageRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userIdStr = tenantProvider.GetUserId();
        var userId = Guid.TryParse(userIdStr, out var uid) ? uid : Guid.Empty;

        var message = new DriverMessage
        {
            TenantId = tenantId,
            ShipmentId = request.ShipmentId,
            SenderId = userId,
            SenderType = SenderType.Operations,
            Message = request.Message,
            CreatedBy = userIdStr
        };

        var id = await driverMessageRepository.CreateAsync(message);
        return Ok(ApiResponse<Guid>.Ok(id));
    }
}

public record OperationsMessageRequest(Guid ShipmentId, string Message);
