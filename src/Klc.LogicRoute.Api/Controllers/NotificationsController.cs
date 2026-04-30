using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(
    INotificationRepository notificationRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Notification>>>> GetAll([FromQuery] int limit = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = Guid.TryParse(tenantProvider.GetUserId(), out var uid) ? uid : (Guid?)null;
        var notifications = await notificationRepository.GetByUserIdAsync(userId, tenantId, limit);
        return Ok(ApiResponse<IEnumerable<Notification>>.Ok(notifications));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = Guid.TryParse(tenantProvider.GetUserId(), out var uid) ? uid : (Guid?)null;
        var count = await notificationRepository.GetUnreadCountAsync(userId, tenantId);
        return Ok(ApiResponse<int>.Ok(count));
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        await notificationRepository.MarkAsReadAsync(id, tenantId);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpPatch("read-all")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAllAsRead()
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = Guid.TryParse(tenantProvider.GetUserId(), out var uid) ? uid : (Guid?)null;
        await notificationRepository.MarkAllAsReadAsync(userId, tenantId);
        return Ok(ApiResponse<bool>.Ok(true));
    }
}
