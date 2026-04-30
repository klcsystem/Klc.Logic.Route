using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class AuditLogRepository(IPostgresConnectionFactory connectionFactory) : IAuditLogRepository
{
    public async Task<IEnumerable<AuditLog>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<AuditLog>(
            "SELECT * FROM logistics.audit_logs WHERE tenant_id = @TenantId ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<IEnumerable<AuditLog>> GetByEntityAsync(string entityType, Guid entityId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<AuditLog>(
            "SELECT * FROM logistics.audit_logs WHERE tenant_id = @TenantId AND entity_type = @EntityType AND entity_id = @EntityId ORDER BY created_at DESC",
            new { TenantId = tenantId, EntityType = entityType, EntityId = entityId });
    }

    public async Task InsertAsync(AuditLog auditLog)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.audit_logs (id, tenant_id, user_id, user_email, action, entity_type, entity_id,
              old_values, new_values, ip_address, user_agent, created_at)
              VALUES (@Id, @TenantId, @UserId, @UserEmail, @Action, @EntityType, @EntityId,
              @OldValues, @NewValues, @IpAddress, @UserAgent, @CreatedAt)",
            new { auditLog.Id, auditLog.TenantId, auditLog.UserId, auditLog.UserEmail,
                auditLog.Action, auditLog.EntityType, auditLog.EntityId,
                auditLog.OldValues, auditLog.NewValues, auditLog.IpAddress, auditLog.UserAgent,
                auditLog.CreatedAt });
    }
}
