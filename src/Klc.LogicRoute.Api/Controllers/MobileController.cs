using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Geofencing;
using Klc.LogicRoute.Application.Mobile.Commands;
using Klc.LogicRoute.Application.Mobile.Queries;
using Klc.LogicRoute.Application.Notifications;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Klc.LogicRoute.Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Klc.LogicRoute.Api.Hubs;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/mobile")]
public class MobileController(
    IMediator mediator,
    ITenantProvider tenantProvider,
    IUserRepository userRepository,
    IRoleRepository roleRepository,
    IDriverRepository driverRepository,
    IShipmentRepository shipmentRepository,
    IJwtTokenService jwtTokenService,
    IFileStorageService fileStorageService,
    IHubContext<TrackingHub> trackingHub,
    INotificationService notificationService) : ControllerBase
{
    [HttpPost("auth/login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<MobileLoginResponse>>> Login([FromBody] MobileLoginRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var user = await userRepository.GetByEmailAsync(request.Email, tenantId);
        if (user == null || !user.IsActive || string.IsNullOrEmpty(user.PasswordHash))
            return Unauthorized(ApiResponse<MobileLoginResponse>.Fail("Gecersiz kullanici bilgileri"));

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(ApiResponse<MobileLoginResponse>.Fail("Gecersiz kullanici bilgileri"));

        await userRepository.UpdateLastLoginAsync(user.Id, user.TenantId);

        // Find associated driver
        var drivers = await driverRepository.GetAllAsync(tenantId);
        var driver = drivers.FirstOrDefault(d => d.UserId == user.Id && d.IsActive);

        var permissions = await roleRepository.GetPermissionsAsync(user.RoleId);
        var token = jwtTokenService.GenerateToken(user, permissions);

        var response = new MobileLoginResponse(
            Token: token,
            UserId: user.Id,
            DriverId: driver?.Id,
            FullName: $"{user.FirstName} {user.LastName}",
            Email: user.Email,
            Role: user.Role?.Name ?? "",
            TenantId: user.TenantId);

        return Ok(ApiResponse<MobileLoginResponse>.Ok(response));
    }

    [HttpGet("shipments")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<Shipment>>>> GetDriverShipments([FromQuery] Guid driverId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipments = await mediator.Send(new GetDriverShipmentsQuery(driverId, tenantId));
        return Ok(ApiResponse<IEnumerable<Shipment>>.Ok(shipments));
    }

    [HttpGet("shipments/{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<Shipment>>> GetShipment(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipment = await shipmentRepository.GetByIdAsync(id, tenantId);
        if (shipment == null)
            return NotFound(ApiResponse<Shipment>.Fail("Sevkiyat bulunamadi"));
        return Ok(ApiResponse<Shipment>.Ok(shipment));
    }

    [HttpPut("shipments/{id:guid}/status")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UpdateShipmentStatusResult>>> UpdateStatus(
        Guid id, [FromBody] MobileStatusUpdateRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await mediator.Send(new UpdateShipmentStatusCommand(id, tenantId, request.Status, request.Notes));
        if (!result.Success)
            return BadRequest(ApiResponse<UpdateShipmentStatusResult>.Fail(result.Message ?? "Guncelleme basarisiz"));
        return Ok(ApiResponse<UpdateShipmentStatusResult>.Ok(result));
    }

    [HttpPost("shipments/{id:guid}/pod")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<UploadProofOfDeliveryResult>>> UploadPod(
        Guid id,
        [FromForm] string? recipientName,
        [FromForm] string? notes,
        [FromForm] double? lat,
        [FromForm] double? lng,
        IFormFile? photo,
        IFormFile? signature)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();

        string? photoPath = null;
        string? signaturePath = null;

        if (photo != null)
        {
            await using var stream = photo.OpenReadStream();
            photoPath = await fileStorageService.SaveAsync(stream, photo.FileName, "pod/photos");
        }

        if (signature != null)
        {
            await using var stream = signature.OpenReadStream();
            signaturePath = await fileStorageService.SaveAsync(stream, signature.FileName, "pod/signatures");
        }

        var result = await mediator.Send(new UploadProofOfDeliveryCommand(
            id, tenantId, recipientName, notes, lat, lng, photoPath, signaturePath, userId));

        if (!result.Success)
            return BadRequest(ApiResponse<UploadProofOfDeliveryResult>.Fail(result.Message ?? "Kayit basarisiz"));
        return Ok(ApiResponse<UploadProofOfDeliveryResult>.Ok(result));
    }

    [HttpPost("location")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UpdateDriverLocationResult>>> UpdateLocation(
        [FromBody] MobileLocationBatchRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await mediator.Send(new UpdateDriverLocationCommand(request.DriverId, tenantId, request.Points));

        // Broadcast latest location via SignalR
        if (request.Points.Count > 0)
        {
            var latest = request.Points.Last();
            if (latest.ShipmentId.HasValue)
            {
                await trackingHub.Clients
                    .Group($"shipment-{latest.ShipmentId}")
                    .SendAsync("ReceiveLocationUpdate", new
                    {
                        shipmentId = latest.ShipmentId,
                        lat = latest.Lat,
                        lng = latest.Lng,
                        speed = latest.Speed,
                        heading = latest.Heading,
                        timestamp = DateTime.UtcNow
                    });
            }
        }

        // Broadcast geofence events via SignalR and send notifications
        foreach (var geofenceEvent in result.GeofenceEvents)
        {
            var eventName = geofenceEvent.EventType == GeofenceEventType.Arrived
                ? "GeofenceArrived"
                : "GeofenceDeparted";

            await trackingHub.Clients
                .Group($"shipment-{geofenceEvent.ShipmentId}")
                .SendAsync(eventName, new
                {
                    shipmentId = geofenceEvent.ShipmentId,
                    driverId = geofenceEvent.DriverId,
                    eventType = geofenceEvent.EventType.ToString(),
                    distanceMeters = geofenceEvent.DistanceMeters,
                    lat = geofenceEvent.DriverLat,
                    lng = geofenceEvent.DriverLng,
                    occurredAt = geofenceEvent.OccurredAt
                });

            var notifType = geofenceEvent.EventType == GeofenceEventType.Arrived
                ? NotificationType.GeofenceArrived
                : NotificationType.GeofenceDeparted;

            var title = geofenceEvent.EventType == GeofenceEventType.Arrived
                ? "Surucu teslimat noktasina ulasti"
                : "Surucu teslimat noktasindan ayrildi";

            await notificationService.SendToAllAsync(
                tenantId, title,
                $"Sevkiyat {geofenceEvent.ShipmentId}: Surucu {geofenceEvent.DistanceMeters:F0}m mesafede",
                notifType);
        }

        return Ok(ApiResponse<UpdateDriverLocationResult>.Ok(result));
    }
}

public record MobileLoginRequest(string Email, string Password);

public record MobileLoginResponse(
    string Token,
    Guid UserId,
    Guid? DriverId,
    string FullName,
    string Email,
    string Role,
    Guid TenantId);

public record MobileStatusUpdateRequest(Domain.Enums.ShipmentStatus Status, string? Notes = null);

public record MobileLocationBatchRequest(Guid DriverId, List<LocationPoint> Points);
