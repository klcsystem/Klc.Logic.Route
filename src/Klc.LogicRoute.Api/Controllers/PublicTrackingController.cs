using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.CustomerEta.Queries;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Klc.LogicRoute.Application.Notifications;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/public/tracking")]
[AllowAnonymous]
public class PublicTrackingController(
    IMediator mediator,
    ICustomerTrackingRepository customerTrackingRepository,
    IDriverMessageRepository driverMessageRepository,
    INotificationService notificationService) : ControllerBase
{
    [HttpGet("{token}")]
    public async Task<ActionResult<ApiResponse<PublicTrackingResult>>> GetByToken(string token)
    {
        var result = await mediator.Send(new GetPublicTrackingQuery(token));
        if (result == null)
            return NotFound(ApiResponse<PublicTrackingResult>.Fail("Takip bilgisi bulunamadı"));

        return Ok(ApiResponse<PublicTrackingResult>.Ok(result));
    }

    /// <summary>
    /// Customer changes delivery point from tracking page.
    /// Accepts: Door, Security, Neighbor, Locker, CustomAddress
    /// </summary>
    [HttpPost("{token}/change-delivery-point")]
    public async Task<ActionResult<ApiResponse<bool>>> ChangeDeliveryPoint(
        string token, [FromBody] ChangeDeliveryPointRequest request)
    {
        var tracking = await customerTrackingRepository.GetByTokenAsync(token);
        if (tracking == null || !tracking.IsActive)
            return NotFound(ApiResponse<bool>.Fail("Takip bilgisi bulunamadı"));

        // Create a notification for operations
        await notificationService.SendToAllAsync(
            tracking.TenantId,
            "Teslimat Noktası Değişikliği Talebi",
            $"Sevkiyat {tracking.ShipmentId}: Müşteri teslimat noktasını değiştirmek istiyor — {request.DeliveryOption}" +
            (string.IsNullOrEmpty(request.CustomAddress) ? "" : $" ({request.CustomAddress})"),
            Domain.Enums.NotificationType.DeliverySlotChange);

        return Ok(ApiResponse<bool>.Ok(true, "Teslimat noktası değişikliği talebi alındı"));
    }

    /// <summary>
    /// Returns tenant branding for the tracking page (logo, colors, contact info).
    /// </summary>
    [HttpGet("{token}/branding")]
    public async Task<ActionResult<ApiResponse<TrackingBrandingResult>>> GetBranding(string token)
    {
        var tracking = await customerTrackingRepository.GetByTokenAsync(token);
        if (tracking == null || !tracking.IsActive)
            return NotFound(ApiResponse<TrackingBrandingResult>.Fail("Takip bilgisi bulunamadı"));

        // TODO: Load company name, logo, colors from tenant settings table when available
        var branding = new TrackingBrandingResult(
            CompanyName: "Logic.Route",
            LogoUrl: null,
            PrimaryColor: "#f97316",
            ContactPhone: tracking.CustomerPhone,
            ContactEmail: tracking.CustomerEmail
        );

        return Ok(ApiResponse<TrackingBrandingResult>.Ok(branding));
    }

    /// <summary>
    /// Customer sends a message to driver from tracking page.
    /// </summary>
    [HttpPost("{token}/messages")]
    public async Task<ActionResult<ApiResponse<Guid>>> SendMessage(
        string token, [FromBody] CustomerMessageRequest request)
    {
        var tracking = await customerTrackingRepository.GetByTokenAsync(token);
        if (tracking == null || !tracking.IsActive)
            return NotFound(ApiResponse<Guid>.Fail("Takip bilgisi bulunamadı"));

        var message = new DriverMessage
        {
            TenantId = tracking.TenantId,
            ShipmentId = tracking.ShipmentId,
            SenderId = tracking.Id, // Use tracking record ID as customer identifier
            SenderType = SenderType.Customer,
            Message = request.Message,
            CreatedBy = "customer"
        };

        var id = await driverMessageRepository.CreateAsync(message);
        return Ok(ApiResponse<Guid>.Ok(id));
    }
}

public record ChangeDeliveryPointRequest(
    string DeliveryOption, // Door, Security, Neighbor, Locker, CustomAddress
    string? CustomAddress = null,
    string? Notes = null);

public record CustomerMessageRequest(string Message);

public record TrackingBrandingResult(
    string CompanyName,
    string? LogoUrl,
    string PrimaryColor,
    string? ContactPhone,
    string? ContactEmail);
