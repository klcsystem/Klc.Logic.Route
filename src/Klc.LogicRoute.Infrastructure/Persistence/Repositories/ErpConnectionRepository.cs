using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class ErpConnectionRepository(IPostgresConnectionFactory connectionFactory) : IErpConnectionRepository
{
    public async Task<ErpConnection?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<ErpConnection>(
            "SELECT * FROM logistics.erp_connections WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<IEnumerable<ErpConnection>> GetAllAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<ErpConnection>(
            "SELECT * FROM logistics.erp_connections WHERE tenant_id = @TenantId AND is_deleted = FALSE ORDER BY name",
            new { TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(ErpConnection connection)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.erp_connections (id, tenant_id, name, erp_type, endpoint_url, username, password,
              is_active, settings, created_by, created_at)
              VALUES (@Id, @TenantId, @Name, @ErpType, @EndpointUrl, @Username, @Password,
              @IsActive, @Settings, @CreatedBy, @CreatedAt)",
            new { connection.Id, connection.TenantId, connection.Name, ErpType = (int)connection.ErpType,
                connection.EndpointUrl, connection.Username, connection.Password,
                connection.IsActive, connection.Settings, connection.CreatedBy, connection.CreatedAt });
        return connection.Id;
    }

    public async Task UpdateAsync(ErpConnection connection)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.erp_connections SET name = @Name, erp_type = @ErpType, endpoint_url = @EndpointUrl,
              username = @Username, password = @Password, is_active = @IsActive, settings = @Settings,
              updated_by = @UpdatedBy, updated_at = @Now
              WHERE id = @Id AND tenant_id = @TenantId",
            new { connection.Id, connection.TenantId, connection.Name, ErpType = (int)connection.ErpType,
                connection.EndpointUrl, connection.Username, connection.Password,
                connection.IsActive, connection.Settings, connection.UpdatedBy, Now = DateTime.UtcNow });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.erp_connections SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }

    public async Task UpdateSyncStatusAsync(Guid id, Guid tenantId, string status)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.erp_connections SET last_sync_at = @Now, last_sync_status = @Status WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Status = status, Now = DateTime.UtcNow });
    }
}
