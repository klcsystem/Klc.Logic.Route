using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class UserRepository(IPostgresConnectionFactory connectionFactory) : IUserRepository
{
    public async Task<User?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var user = await conn.QueryFirstOrDefaultAsync<User>(
            "SELECT * FROM auth.users WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId });
        if (user != null)
            user.Role = await conn.QueryFirstOrDefaultAsync<OperationClaim>(
                "SELECT * FROM auth.operation_claims WHERE id = @RoleId", new { user.RoleId });
        return user;
    }

    public async Task<User?> GetByEmailAsync(string email, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var user = await conn.QueryFirstOrDefaultAsync<User>(
            "SELECT * FROM auth.users WHERE email = @Email AND tenant_id = @TenantId",
            new { Email = email, TenantId = tenantId });
        if (user != null)
            user.Role = await conn.QueryFirstOrDefaultAsync<OperationClaim>(
                "SELECT * FROM auth.operation_claims WHERE id = @RoleId", new { user.RoleId });
        return user;
    }

    public async Task<IEnumerable<User>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        var users = (await conn.QueryAsync<User>(
            "SELECT * FROM auth.users WHERE tenant_id = @TenantId ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset })).ToList();

        if (users.Count > 0)
        {
            var roleIds = users.Select(u => u.RoleId).Distinct().ToArray();
            var roles = (await conn.QueryAsync<OperationClaim>(
                "SELECT * FROM auth.operation_claims WHERE id = ANY(@RoleIds)", new { RoleIds = roleIds }))
                .ToDictionary(r => r.Id);
            foreach (var user in users)
                if (roles.TryGetValue(user.RoleId, out var role))
                    user.Role = role;
        }
        return users;
    }

    public async Task<int> GetCountAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM auth.users WHERE tenant_id = @TenantId",
            new { TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(User user)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO auth.users (id, tenant_id, email, password_hash, first_name, last_name, is_active, role_id, created_at)
              VALUES (@Id, @TenantId, @Email, @PasswordHash, @FirstName, @LastName, @IsActive, @RoleId, @CreatedAt)",
            new
            {
                user.Id, user.TenantId, user.Email, user.PasswordHash,
                user.FirstName, user.LastName, user.IsActive, user.RoleId, user.CreatedAt
            });
        return user.Id;
    }

    public async Task UpdateAsync(User user)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE auth.users SET email = @Email, first_name = @FirstName, last_name = @LastName,
              is_active = @IsActive, role_id = @RoleId, updated_at = @UpdatedAt
              WHERE id = @Id AND tenant_id = @TenantId",
            new
            {
                user.Id, user.TenantId, user.Email, user.FirstName, user.LastName,
                user.IsActive, user.RoleId, UpdatedAt = DateTime.UtcNow
            });
    }

    public async Task UpdateLastLoginAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE auth.users SET last_login_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "DELETE FROM auth.users WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId });
    }
}
