using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IWebhookEventRepository
{
    Task<IEnumerable<WebhookEvent>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<Guid> InsertAsync(WebhookEvent webhookEvent);
    Task UpdateStatusAsync(Guid id, string status, string? notes);
}
