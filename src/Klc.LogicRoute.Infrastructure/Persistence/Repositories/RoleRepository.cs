using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class RoleRepository(IPostgresConnectionFactory connectionFactory) : IRoleRepository
{
    public async Task<OperationClaim?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<OperationClaim>(
            "SELECT * FROM auth.operation_claims WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<OperationClaim?> GetByNameAsync(string name, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<OperationClaim>(
            "SELECT * FROM auth.operation_claims WHERE name = @Name AND tenant_id = @TenantId",
            new { Name = name, TenantId = tenantId });
    }

    public async Task<IEnumerable<OperationClaim>> GetAllAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<OperationClaim>(
            "SELECT * FROM auth.operation_claims WHERE tenant_id = @TenantId ORDER BY name",
            new { TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(OperationClaim role)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO auth.operation_claims (id, tenant_id, name, description, is_system_role, created_at)
              VALUES (@Id, @TenantId, @Name, @Description, @IsSystemRole, @CreatedAt)",
            new { role.Id, role.TenantId, role.Name, role.Description, role.IsSystemRole, role.CreatedAt });
        return role.Id;
    }

    public async Task UpdateAsync(OperationClaim role)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE auth.operation_claims SET name = @Name, description = @Description WHERE id = @Id AND tenant_id = @TenantId",
            new { role.Id, role.TenantId, role.Name, role.Description });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "DELETE FROM auth.operation_claims WHERE id = @Id AND tenant_id = @TenantId AND is_system_role = FALSE",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<IEnumerable<string>> GetPermissionsAsync(Guid roleId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<string>(
            "SELECT permission FROM auth.user_operation_claims WHERE role_id = @RoleId",
            new { RoleId = roleId });
    }

    public async Task SetPermissionsAsync(Guid roleId, IEnumerable<string> permissions)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();

        await conn.ExecuteAsync("DELETE FROM auth.user_operation_claims WHERE role_id = @RoleId",
            new { RoleId = roleId }, tx);

        foreach (var perm in permissions)
        {
            await conn.ExecuteAsync(
                "INSERT INTO auth.user_operation_claims (id, role_id, permission) VALUES (@Id, @RoleId, @Permission)",
                new { Id = Guid.NewGuid(), RoleId = roleId, Permission = perm }, tx);
        }

        await tx.CommitAsync();
    }
}
