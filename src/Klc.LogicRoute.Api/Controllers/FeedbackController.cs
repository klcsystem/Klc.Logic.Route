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
public class FeedbackController(
    IDeliveryFeedbackRepository feedbackRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>
    /// Submit feedback — public endpoint, no auth required for customer submissions.
    /// TenantId must be provided in the body.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<Guid>>> Submit([FromBody] SubmitFeedbackRequest request)
    {
        if (request.Rating < 1 || request.Rating > 5)
            return BadRequest(ApiResponse<Guid>.Fail("Rating must be between 1 and 5."));

        var feedback = new DeliveryFeedback
        {
            TenantId = request.TenantId,
            ShipmentId = request.ShipmentId,
            OrderId = request.OrderId,
            Rating = request.Rating,
            Comment = request.Comment,
            FeedbackType = request.FeedbackType,
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            DriverId = request.DriverId
        };

        await feedbackRepository.InsertAsync(feedback);
        return Ok(ApiResponse<Guid>.Ok(feedback.Id, "Geri bildiriminiz için teşekkürler."));
    }

    /// <summary>
    /// List all feedback — requires authentication.
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<DeliveryFeedback>>>> GetAll(
        [FromQuery] int limit = 100, [FromQuery] int offset = 0)
    {
        var tenantId = tenantProvider.GetTenantId();
        var feedback = await feedbackRepository.GetAllAsync(tenantId, limit, offset);
        return Ok(ApiResponse<IEnumerable<DeliveryFeedback>>.Ok(feedback));
    }

    /// <summary>
    /// Get feedback summary — average rating, count by score.
    /// </summary>
    [HttpGet("summary")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<FeedbackSummary>>> GetSummary()
    {
        var tenantId = tenantProvider.GetTenantId();
        var summary = await feedbackRepository.GetSummaryAsync(tenantId);
        return Ok(ApiResponse<FeedbackSummary>.Ok(summary));
    }

    /// <summary>
    /// Get feedback by shipment ID.
    /// </summary>
    [HttpGet("shipment/{shipmentId:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<DeliveryFeedback>>>> GetByShipment(Guid shipmentId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var feedback = await feedbackRepository.GetByShipmentIdAsync(shipmentId, tenantId);
        return Ok(ApiResponse<IEnumerable<DeliveryFeedback>>.Ok(feedback));
    }

    /// <summary>
    /// Get feedback by driver ID.
    /// </summary>
    [HttpGet("driver/{driverId:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<DeliveryFeedback>>>> GetByDriver(Guid driverId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var feedback = await feedbackRepository.GetByDriverIdAsync(driverId, tenantId);
        return Ok(ApiResponse<IEnumerable<DeliveryFeedback>>.Ok(feedback));
    }
}

public record SubmitFeedbackRequest(
    Guid TenantId,
    Guid? ShipmentId,
    Guid? OrderId,
    int Rating,
    string? Comment,
    FeedbackType FeedbackType,
    string? CustomerName,
    string? CustomerPhone,
    Guid? DriverId);
