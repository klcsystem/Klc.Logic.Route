using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class NotificationRepository(IPostgresConnectionFactory connectionFactory) : INotificationRepository
{
    public async Task<IEnumerable<Notification>> GetByUserIdAsync(Guid? userId, Guid tenantId, int limit = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<Notification>(
            @"SELECT * FROM logistics.notifications
              WHERE tenant_id = @TenantId AND (user_id = @UserId OR user_id IS NULL)
              ORDER BY created_at DESC LIMIT @Limit",
            new { UserId = userId, TenantId = tenantId, Limit = limit });
    }

    public async Task<int> GetUnreadCountAsync(Guid? userId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.ExecuteScalarAsync<int>(
            @"SELECT COUNT(*) FROM logistics.notifications
              WHERE tenant_id = @TenantId AND (user_id = @UserId OR user_id IS NULL) AND is_read = FALSE",
            new { UserId = userId, TenantId = tenantId });
    }

    public async Task InsertAsync(Notification notification)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.notifications (id, tenant_id, user_id, title, message, type,
              is_read, related_entity_type, related_entity_id, created_at)
              VALUES (@Id, @TenantId, @UserId, @Title, @Message, @Type,
              @IsRead, @RelatedEntityType, @RelatedEntityId, @CreatedAt)",
            new { notification.Id, notification.TenantId, notification.UserId,
                notification.Title, notification.Message, Type = (int)notification.Type,
                notification.IsRead, notification.RelatedEntityType, notification.RelatedEntityId,
                notification.CreatedAt });
    }

    public async Task MarkAsReadAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.notifications SET is_read = TRUE, read_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }

    public async Task MarkAllAsReadAsync(Guid? userId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.notifications SET is_read = TRUE, read_at = @Now
              WHERE tenant_id = @TenantId AND (user_id = @UserId OR user_id IS NULL) AND is_read = FALSE",
            new { UserId = userId, TenantId = tenantId, Now = DateTime.UtcNow });
    }
}
