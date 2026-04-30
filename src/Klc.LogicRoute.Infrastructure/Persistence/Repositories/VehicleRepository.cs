using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class VehicleRepository(IPostgresConnectionFactory connectionFactory) : IVehicleRepository
{
    public async Task<List<Vehicle>> GetAllAsync(Guid tenantId, Guid? providerId = null)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var sql = "SELECT * FROM logistics.vehicles WHERE tenant_id = @TenantId AND is_deleted = FALSE";
        if (providerId.HasValue) sql += " AND provider_id = @ProviderId";
        sql += " ORDER BY created_at DESC";
        var result = await conn.QueryAsync<Vehicle>(sql, new { TenantId = tenantId, ProviderId = providerId });
        return result.ToList();
    }

    public async Task<Vehicle?> GetByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<Vehicle>(
            "SELECT * FROM logistics.vehicles WHERE id = @Id AND is_deleted = FALSE", new { Id = id });
    }

    public async Task<Guid> InsertAsync(Vehicle vehicle)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        vehicle.Id = Guid.NewGuid();
        vehicle.CreatedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            INSERT INTO logistics.vehicles (id, tenant_id, provider_id, plate_number, vehicle_type, body_type, tonnage, is_active, insurance_expiry, current_driver_id, note, created_at, is_deleted)
            VALUES (@Id, @TenantId, @ProviderId, @PlateNumber, @VehicleType, @BodyType, @Tonnage, @IsActive, @InsuranceExpiry, @CurrentDriverId, @Note, @CreatedAt, FALSE)", vehicle);
        return vehicle.Id;
    }

    public async Task UpdateAsync(Vehicle vehicle)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        vehicle.UpdatedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            UPDATE logistics.vehicles SET plate_number = @PlateNumber, vehicle_type = @VehicleType, body_type = @BodyType, tonnage = @Tonnage, is_active = @IsActive, insurance_expiry = @InsuranceExpiry, current_driver_id = @CurrentDriverId, note = @Note, updated_at = @UpdatedAt
            WHERE id = @Id", vehicle);
    }

    public async Task DeleteAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync("UPDATE logistics.vehicles SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id",
            new { Id = id, Now = DateTime.UtcNow });
    }
}
