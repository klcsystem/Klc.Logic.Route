using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface INotificationRepository
{
    Task<IEnumerable<Notification>> GetByUserIdAsync(Guid? userId, Guid tenantId, int limit = 50);
    Task<int> GetUnreadCountAsync(Guid? userId, Guid tenantId);
    Task InsertAsync(Notification notification);
    Task MarkAsReadAsync(Guid id, Guid tenantId);
    Task MarkAllAsReadAsync(Guid? userId, Guid tenantId);
}
