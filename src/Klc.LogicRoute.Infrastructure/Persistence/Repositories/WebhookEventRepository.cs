using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class WebhookEventRepository(IPostgresConnectionFactory connectionFactory) : IWebhookEventRepository
{
    public async Task<IEnumerable<WebhookEvent>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<WebhookEvent>(
            "SELECT * FROM logistics.webhook_events WHERE tenant_id = @TenantId ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<Guid> InsertAsync(WebhookEvent webhookEvent)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.webhook_events (id, tenant_id, provider_code, event_type, tracking_number,
              payload, status, created_at)
              VALUES (@Id, @TenantId, @ProviderCode, @EventType, @TrackingNumber, @Payload, @Status, @CreatedAt)",
            new { webhookEvent.Id, webhookEvent.TenantId, webhookEvent.ProviderCode, webhookEvent.EventType,
                webhookEvent.TrackingNumber, webhookEvent.Payload, webhookEvent.Status, webhookEvent.CreatedAt });
        return webhookEvent.Id;
    }

    public async Task UpdateStatusAsync(Guid id, string status, string? notes)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.webhook_events SET status = @Status, processing_notes = @Notes, processed_at = @Now WHERE id = @Id",
            new { Id = id, Status = status, Notes = notes, Now = DateTime.UtcNow });
    }
}
