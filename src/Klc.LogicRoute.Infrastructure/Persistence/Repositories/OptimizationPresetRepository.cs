using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class OptimizationPresetRepository(IPostgresConnectionFactory connectionFactory) : IOptimizationPresetRepository
{
    public async Task<List<OptimizationPreset>> GetAllAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryAsync<OptimizationPreset>(
            "SELECT * FROM logistics.optimization_presets WHERE tenant_id = @TenantId AND is_deleted = FALSE ORDER BY is_default DESC, name",
            new { TenantId = tenantId });
        return result.ToList();
    }

    public async Task<OptimizationPreset?> GetByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<OptimizationPreset>(
            "SELECT * FROM logistics.optimization_presets WHERE id = @Id AND is_deleted = FALSE", new { Id = id });
    }

    public async Task<OptimizationPreset?> GetDefaultAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<OptimizationPreset>(
            "SELECT * FROM logistics.optimization_presets WHERE tenant_id = @TenantId AND is_default = TRUE AND is_deleted = FALSE",
            new { TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(OptimizationPreset preset)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        preset.Id = Guid.NewGuid();
        preset.CreatedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            INSERT INTO logistics.optimization_presets (id, tenant_id, name, description, max_stops_per_route, max_distance_km,
                   max_duration_minutes, break_duration_minutes, break_after_minutes, allow_overnight, balance_workload,
                   route_end_mode, end_address, end_lat, end_lng, is_default, created_at, created_by, is_deleted)
            VALUES (@Id, @TenantId, @Name, @Description, @MaxStopsPerRoute, @MaxDistanceKm,
                   @MaxDurationMinutes, @BreakDurationMinutes, @BreakAfterMinutes, @AllowOvernight, @BalanceWorkload,
                   @RouteEndMode, @EndAddress, @EndLat, @EndLng, @IsDefault, @CreatedAt, @CreatedBy, FALSE)", preset);
        return preset.Id;
    }

    public async Task UpdateAsync(OptimizationPreset preset)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        preset.UpdatedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            UPDATE logistics.optimization_presets SET name = @Name, description = @Description,
                   max_stops_per_route = @MaxStopsPerRoute, max_distance_km = @MaxDistanceKm,
                   max_duration_minutes = @MaxDurationMinutes, break_duration_minutes = @BreakDurationMinutes,
                   break_after_minutes = @BreakAfterMinutes, allow_overnight = @AllowOvernight,
                   balance_workload = @BalanceWorkload, route_end_mode = @RouteEndMode,
                   end_address = @EndAddress, end_lat = @EndLat, end_lng = @EndLng,
                   is_default = @IsDefault, updated_at = @UpdatedAt, updated_by = @UpdatedBy
            WHERE id = @Id", preset);
    }

    public async Task DeleteAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.optimization_presets SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id",
            new { Id = id, Now = DateTime.UtcNow });
    }
}
