using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class NotificationTemplateRepository(IPostgresConnectionFactory connectionFactory) : INotificationTemplateRepository
{
    public async Task<NotificationTemplate?> GetByStageAndChannelAsync(Guid tenantId, DeliveryNotificationStage stage, NotificationChannel channel)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<NotificationTemplate>(
            @"SELECT * FROM logistics.notification_templates
              WHERE tenant_id = @TenantId AND stage = @Stage AND channel = @Channel AND is_active = TRUE AND is_deleted = FALSE
              LIMIT 1",
            new { TenantId = tenantId, Stage = (int)stage, Channel = (int)channel });
    }

    public async Task<IEnumerable<NotificationTemplate>> GetAllAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<NotificationTemplate>(
            @"SELECT * FROM logistics.notification_templates
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY stage, channel",
            new { TenantId = tenantId });
    }

    public async Task InsertAsync(NotificationTemplate template)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.notification_templates
              (id, tenant_id, name, channel, stage, subject, template_body, variables, is_active, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @Name, @Channel, @Stage, @Subject, @TemplateBody, @Variables, @IsActive, FALSE, @CreatedAt, @CreatedBy)",
            new
            {
                template.Id, template.TenantId, template.Name,
                Channel = (int)template.Channel, Stage = (int)template.Stage,
                template.Subject, template.TemplateBody, template.Variables,
                template.IsActive, template.CreatedAt, template.CreatedBy
            });
    }

    public async Task UpdateAsync(NotificationTemplate template)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.notification_templates
              SET name = @Name, channel = @Channel, stage = @Stage, subject = @Subject,
                  template_body = @TemplateBody, variables = @Variables, is_active = @IsActive,
                  updated_at = @UpdatedAt, updated_by = @UpdatedBy
              WHERE id = @Id AND tenant_id = @TenantId",
            new
            {
                template.Id, template.TenantId, template.Name,
                Channel = (int)template.Channel, Stage = (int)template.Stage,
                template.Subject, template.TemplateBody, template.Variables,
                template.IsActive, UpdatedAt = DateTime.UtcNow, template.UpdatedBy
            });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.notification_templates SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }
}
