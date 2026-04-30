using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Application.Notifications;

public interface INotificationService
{
    Task SendAsync(Guid tenantId, Guid? userId, string title, string message,
        NotificationType type, string? relatedEntityType = null, Guid? relatedEntityId = null);
    Task SendToAllAsync(Guid tenantId, string title, string message, NotificationType type);
}
