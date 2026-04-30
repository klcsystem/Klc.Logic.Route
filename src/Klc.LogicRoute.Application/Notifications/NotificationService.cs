using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.Notifications;

public class NotificationService(INotificationRepository notificationRepository) : INotificationService
{
    public async Task SendAsync(Guid tenantId, Guid? userId, string title, string message,
        NotificationType type, string? relatedEntityType = null, Guid? relatedEntityId = null)
    {
        var notification = new Notification
        {
            TenantId = tenantId,
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            RelatedEntityType = relatedEntityType,
            RelatedEntityId = relatedEntityId
        };
        await notificationRepository.InsertAsync(notification);
    }

    public async Task SendToAllAsync(Guid tenantId, string title, string message, NotificationType type)
    {
        await SendAsync(tenantId, null, title, message, type);
    }
}
