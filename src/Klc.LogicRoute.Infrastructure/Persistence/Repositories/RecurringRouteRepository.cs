using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class RecurringRouteRepository(IPostgresConnectionFactory connectionFactory) : IRecurringRouteRepository
{
    public async Task<RecurringRoute?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstOrDefaultAsync<RecurringRoute>(
            @"SELECT * FROM logistics.recurring_routes
              WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });

        if (result != null)
        {
            result.Stops = (await GetStopsByRecurringRouteIdAsync(id, tenantId)).ToList();
        }

        return result;
    }

    public async Task<IEnumerable<RecurringRoute>> GetAllAsync(Guid tenantId, bool? activeOnly = null)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();

        var sql = @"SELECT * FROM logistics.recurring_routes
                    WHERE tenant_id = @TenantId AND is_deleted = FALSE";

        if (activeOnly == true)
            sql += " AND is_active = TRUE";

        sql += " ORDER BY created_at DESC";

        return await conn.QueryAsync<RecurringRoute>(sql, new { TenantId = tenantId });
    }

    public async Task<Guid> CreateAsync(RecurringRoute recurringRoute)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.recurring_routes
              (id, tenant_id, name, schedule, days_of_week, is_active, source_optimization_id,
               last_activated_at, activation_count, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @Name, @Schedule, @DaysOfWeek, @IsActive, @SourceOptimizationId,
               @LastActivatedAt, @ActivationCount, FALSE, @CreatedAt, @CreatedBy)",
            recurringRoute);
        return recurringRoute.Id;
    }

    public async Task CreateStopAsync(RecurringRouteStop stop)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.recurring_route_stops
              (id, tenant_id, recurring_route_id, stop_order, stop_type, address,
               lat, lng, time_window_start, time_window_end, service_time_minutes,
               customer_name, notes, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @RecurringRouteId, @StopOrder, @StopType, @Address,
               @Lat, @Lng, @TimeWindowStart, @TimeWindowEnd, @ServiceTimeMinutes,
               @CustomerName, @Notes, FALSE, @CreatedAt, @CreatedBy)",
            stop);
    }

    public async Task UpdateAsync(RecurringRoute recurringRoute)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.recurring_routes
              SET name = @Name, schedule = @Schedule, days_of_week = @DaysOfWeek,
                  is_active = @IsActive, last_activated_at = @LastActivatedAt,
                  activation_count = @ActivationCount, updated_at = @UpdatedAt, updated_by = @UpdatedBy
              WHERE id = @Id AND tenant_id = @TenantId",
            recurringRoute);
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.recurring_routes SET is_deleted = TRUE, updated_at = NOW()
              WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId });

        await conn.ExecuteAsync(
            @"UPDATE logistics.recurring_route_stops SET is_deleted = TRUE, updated_at = NOW()
              WHERE recurring_route_id = @RecurringRouteId AND tenant_id = @TenantId",
            new { RecurringRouteId = id, TenantId = tenantId });
    }

    public async Task<IEnumerable<RecurringRouteStop>> GetStopsByRecurringRouteIdAsync(Guid recurringRouteId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<RecurringRouteStop>(
            @"SELECT * FROM logistics.recurring_route_stops
              WHERE recurring_route_id = @RecurringRouteId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY stop_order",
            new { RecurringRouteId = recurringRouteId, TenantId = tenantId });
    }
}
