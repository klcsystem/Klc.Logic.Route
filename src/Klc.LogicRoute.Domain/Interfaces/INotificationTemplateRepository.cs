using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface INotificationTemplateRepository
{
    Task<NotificationTemplate?> GetByStageAndChannelAsync(Guid tenantId, DeliveryNotificationStage stage, NotificationChannel channel);
    Task<IEnumerable<NotificationTemplate>> GetAllAsync(Guid tenantId);
    Task InsertAsync(NotificationTemplate template);
    Task UpdateAsync(NotificationTemplate template);
    Task DeleteAsync(Guid id, Guid tenantId);
}
