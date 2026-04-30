using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class DriverRepository(IPostgresConnectionFactory connectionFactory) : IDriverRepository
{
    public async Task<List<Driver>> GetAllAsync(Guid tenantId, Guid? providerId = null)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var sql = "SELECT * FROM logistics.drivers WHERE tenant_id = @TenantId AND is_deleted = FALSE";
        if (providerId.HasValue) sql += " AND provider_id = @ProviderId";
        sql += " ORDER BY created_at DESC";
        var result = await conn.QueryAsync<Driver>(sql, new { TenantId = tenantId, ProviderId = providerId });
        return result.ToList();
    }

    public async Task<Driver?> GetByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<Driver>(
            "SELECT * FROM logistics.drivers WHERE id = @Id AND is_deleted = FALSE", new { Id = id });
    }

    public async Task<Guid> InsertAsync(Driver driver)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        driver.Id = Guid.NewGuid();
        driver.CreatedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            INSERT INTO logistics.drivers (id, tenant_id, provider_id, full_name, phone, license_number, license_expiry, is_active, created_at, is_deleted)
            VALUES (@Id, @TenantId, @ProviderId, @FullName, @Phone, @LicenseNumber, @LicenseExpiry, @IsActive, @CreatedAt, FALSE)", driver);
        return driver.Id;
    }

    public async Task UpdateAsync(Driver driver)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        driver.UpdatedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            UPDATE logistics.drivers SET full_name = @FullName, phone = @Phone, license_number = @LicenseNumber, license_expiry = @LicenseExpiry, is_active = @IsActive, updated_at = @UpdatedAt
            WHERE id = @Id", driver);
    }

    public async Task DeleteAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync("UPDATE logistics.drivers SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id",
            new { Id = id, Now = DateTime.UtcNow });
    }
}
