using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class LocationRepository(IPostgresConnectionFactory connectionFactory) : ILocationRepository
{
    public async Task<List<Location>> GetAllAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryAsync<Location>(
            "SELECT * FROM logistics.locations WHERE tenant_id = @TenantId AND is_deleted = FALSE ORDER BY name",
            new { TenantId = tenantId });
        return result.ToList();
    }

    public async Task<Location?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<Location>(
            "SELECT * FROM logistics.locations WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(Location location)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        location.Id = Guid.NewGuid();
        location.CreatedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            INSERT INTO logistics.locations (id, tenant_id, name, code, location_type, address, city, district,
                latitude, longitude, is_active, capacity, working_hours, contact_name, contact_phone,
                created_by, created_at, is_deleted)
            VALUES (@Id, @TenantId, @Name, @Code, @LocationType, @Address, @City, @District,
                @Latitude, @Longitude, @IsActive, @Capacity, @WorkingHours, @ContactName, @ContactPhone,
                @CreatedBy, @CreatedAt, FALSE)",
            new
            {
                location.Id, location.TenantId, location.Name, location.Code,
                LocationType = (int)location.LocationType,
                location.Address, location.City, location.District,
                location.Latitude, location.Longitude, location.IsActive, location.Capacity,
                location.WorkingHours, location.ContactName, location.ContactPhone,
                location.CreatedBy, location.CreatedAt
            });
        return location.Id;
    }

    public async Task UpdateAsync(Location location)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        location.UpdatedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            UPDATE logistics.locations SET name = @Name, code = @Code, location_type = @LocationType,
                address = @Address, city = @City, district = @District,
                latitude = @Latitude, longitude = @Longitude, is_active = @IsActive,
                capacity = @Capacity, working_hours = @WorkingHours,
                contact_name = @ContactName, contact_phone = @ContactPhone,
                updated_by = @UpdatedBy, updated_at = @UpdatedAt
            WHERE id = @Id AND tenant_id = @TenantId",
            new
            {
                location.Id, location.TenantId, location.Name, location.Code,
                LocationType = (int)location.LocationType,
                location.Address, location.City, location.District,
                location.Latitude, location.Longitude, location.IsActive, location.Capacity,
                location.WorkingHours, location.ContactName, location.ContactPhone,
                location.UpdatedBy, location.UpdatedAt
            });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.locations SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }
}
