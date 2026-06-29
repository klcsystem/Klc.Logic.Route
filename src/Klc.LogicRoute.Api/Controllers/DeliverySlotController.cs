using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Pipeline;
using Klc.LogicRoute.Application.Pipeline.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/delivery-slots")]
[Authorize]
public class DeliverySlotController(
    IDeliverySlotRepository deliverySlotRepository,
    ISmartSlotService smartSlotService,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet("available")]
    public async Task<ActionResult<ApiResponse<IEnumerable<DeliverySlot>>>> GetAvailable(
        [FromQuery] DateOnly date, [FromQuery] string? zipCode)
    {
        var tenantId = tenantProvider.GetTenantId();
        var slots = await deliverySlotRepository.GetAvailableAsync(tenantId, date, zipCode);
        return Ok(ApiResponse<IEnumerable<DeliverySlot>>.Ok(slots));
    }

    [HttpPost("reserve")]
    public async Task<ActionResult<ApiResponse<Guid>>> Reserve([FromBody] ReserveSlotRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var slot = await deliverySlotRepository.GetByIdAsync(request.SlotId, tenantId);

        if (slot == null)
            return NotFound(ApiResponse<Guid>.Fail("Teslimat slotu bulunamadi"));

        if (slot.Status != DeliverySlotStatus.Available)
            return BadRequest(ApiResponse<Guid>.Fail("Bu slot artik musait degil"));

        var expiresAt = DateTime.UtcNow.AddMinutes(30);
        await deliverySlotRepository.ReserveAsync(request.SlotId, tenantId, request.CustomerName, request.CustomerPhone, expiresAt);

        return Ok(ApiResponse<Guid>.Ok(request.SlotId));
    }

    [HttpPost("{id:guid}/confirm")]
    public async Task<ActionResult<ApiResponse<Guid>>> Confirm(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var slot = await deliverySlotRepository.GetByIdAsync(id, tenantId);

        if (slot == null)
            return NotFound(ApiResponse<Guid>.Fail("Teslimat slotu bulunamadi"));

        if (slot.Status != DeliverySlotStatus.Reserved)
            return BadRequest(ApiResponse<Guid>.Fail("Slot rezerve durumunda degil"));

        if (slot.ExpiresAt.HasValue && slot.ExpiresAt.Value < DateTime.UtcNow)
        {
            await deliverySlotRepository.UpdateStatusAsync(id, tenantId, DeliverySlotStatus.Expired);
            return BadRequest(ApiResponse<Guid>.Fail("Rezervasyon suresi dolmus"));
        }

        await deliverySlotRepository.ConfirmAsync(id, tenantId);
        return Ok(ApiResponse<Guid>.Ok(id));
    }
    [HttpGet("smart")]
    public async Task<ActionResult<ApiResponse<List<SmartSlot>>>> GetSmartSlots(
        [FromQuery] Guid orderId, [FromQuery] DateOnly date)
    {
        var tenantId = tenantProvider.GetTenantId();

        try
        {
            var slots = await smartSlotService.SuggestSlotsAsync(orderId, date, tenantId);
            return Ok(ApiResponse<List<SmartSlot>>.Ok(slots));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<List<SmartSlot>>.Fail(ex.Message));
        }
    }
}

public record ReserveSlotRequest(Guid SlotId, string CustomerName, string CustomerPhone);
