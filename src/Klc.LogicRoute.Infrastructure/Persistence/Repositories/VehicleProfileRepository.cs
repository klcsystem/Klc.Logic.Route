using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class VehicleProfileRepository(IPostgresConnectionFactory connectionFactory) : IVehicleProfileRepository
{
    public async Task<List<VehicleProfile>> GetAllAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryAsync<VehicleProfile>(
            "SELECT * FROM logistics.vehicle_profiles WHERE tenant_id = @TenantId AND is_deleted = FALSE ORDER BY is_default DESC, name",
            new { TenantId = tenantId });
        return result.ToList();
    }

    public async Task<VehicleProfile?> GetByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<VehicleProfile>(
            "SELECT * FROM logistics.vehicle_profiles WHERE id = @Id AND is_deleted = FALSE", new { Id = id });
    }

    public async Task<Guid> InsertAsync(VehicleProfile profile)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        profile.Id = Guid.NewGuid();
        profile.CreatedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            INSERT INTO logistics.vehicle_profiles (id, tenant_id, name, description, max_weight_kg, max_volume_m3, max_height_m, max_width_m, max_length_m,
                   is_hazmat, is_frigorifik, avoid_tolls, avoid_ferries, cost_per_km, is_default, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @Name, @Description, @MaxWeightKg, @MaxVolumeM3, @MaxHeightM, @MaxWidthM, @MaxLengthM,
                   @IsHazmat, @IsFrigorifik, @AvoidTolls, @AvoidFerries, @CostPerKm, @IsDefault, @CreatedAt, @CreatedBy, FALSE)", profile);
        return profile.Id;
    }

    public async Task UpdateAsync(VehicleProfile profile)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        profile.UpdatedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            UPDATE logistics.vehicle_profiles SET name = @Name, description = @Description,
                   max_weight_kg = @MaxWeightKg, max_volume_m3 = @MaxVolumeM3,
                   max_height_m = @MaxHeightM, max_width_m = @MaxWidthM, max_length_m = @MaxLengthM,
                   is_hazmat = @IsHazmat, is_frigorifik = @IsFrigorifik,
                   avoid_tolls = @AvoidTolls, avoid_ferries = @AvoidFerries,
                   cost_per_km = @CostPerKm, is_default = @IsDefault,
                   updated_at = @UpdatedAt, updated_by = @UpdatedBy
            WHERE id = @Id", profile);
    }

    public async Task DeleteAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.vehicle_profiles SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id",
            new { Id = id, Now = DateTime.UtcNow });
    }

    public async Task AssignToVehiclesAsync(Guid profileId, List<Guid> vehicleIds)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.vehicles SET profile_id = @ProfileId, updated_at = @Now WHERE id = ANY(@VehicleIds)",
            new { ProfileId = profileId, VehicleIds = vehicleIds.ToArray(), Now = DateTime.UtcNow });
    }
}
