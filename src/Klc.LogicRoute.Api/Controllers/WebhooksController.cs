using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController(
    IWebhookEventRepository webhookEventRepository,
    IShipmentRepository shipmentRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpPost("receive/{providerCode}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> Receive(string providerCode, [FromBody] WebhookPayload payload)
    {
        var tenantId = tenantProvider.GetTenantId();

        var webhookEvent = new WebhookEvent
        {
            TenantId = tenantId,
            ProviderCode = providerCode,
            EventType = payload.EventType,
            TrackingNumber = payload.TrackingNumber,
            Payload = System.Text.Json.JsonSerializer.Serialize(payload),
            Status = "Received"
        };

        await webhookEventRepository.InsertAsync(webhookEvent);

        // Process status update if tracking number provided
        if (!string.IsNullOrEmpty(payload.TrackingNumber) && !string.IsNullOrEmpty(payload.Status))
        {
            // TODO: Find shipment by tracking number and update status
            await webhookEventRepository.UpdateStatusAsync(webhookEvent.Id, "Processed", $"Status: {payload.Status}");
        }

        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpGet("events")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<WebhookEvent>>>> GetEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var events = await webhookEventRepository.GetAllAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<WebhookEvent>>.Ok(events));
    }
}

public record WebhookPayload(string EventType, string? TrackingNumber, string? Status, string? Data);
