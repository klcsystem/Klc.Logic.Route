using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class RouteOptimizationRepository(IPostgresConnectionFactory connectionFactory) : IRouteOptimizationRepository
{
    public async Task<RouteOptimizationResult?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstOrDefaultAsync<RouteOptimizationResult>(
            @"SELECT * FROM logistics.route_optimization_results
              WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });

        if (result != null)
        {
            result.Routes = (await GetRoutesByOptimizationIdAsync(id, tenantId)).ToList();
            foreach (var route in result.Routes)
                route.Stops = (await GetStopsByRouteIdAsync(route.Id, tenantId)).ToList();
        }

        return result;
    }

    public async Task<IEnumerable<RouteOptimizationResult>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 20)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<RouteOptimizationResult>(
            @"SELECT * FROM logistics.route_optimization_results
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = (page - 1) * pageSize });
    }

    public async Task<Guid> CreateAsync(RouteOptimizationResult result)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.route_optimization_results
              (id, tenant_id, name, status, total_distance_km, total_duration_minutes, total_cost,
               vehicle_count, stop_count, solver_type, solve_time_ms, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @Name, @Status, @TotalDistanceKm, @TotalDurationMinutes, @TotalCost,
               @VehicleCount, @StopCount, @SolverType, @SolveTimeMs, FALSE, @CreatedAt, @CreatedBy)",
            result);
        return result.Id;
    }

    public async Task UpdateAsync(RouteOptimizationResult result)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.route_optimization_results
              SET status = @Status, total_distance_km = @TotalDistanceKm,
                  total_duration_minutes = @TotalDurationMinutes, total_cost = @TotalCost,
                  vehicle_count = @VehicleCount, stop_count = @StopCount,
                  solve_time_ms = @SolveTimeMs, updated_at = @UpdatedAt
              WHERE id = @Id AND tenant_id = @TenantId",
            result);
    }

    public async Task CreateRouteAsync(OptimizedRoute route)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.optimized_routes
              (id, tenant_id, optimization_id, vehicle_id, vehicle_plate, sequence_order,
               total_distance_km, total_duration_minutes, total_weight_kg, total_volume_m3,
               is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @OptimizationId, @VehicleId, @VehiclePlate, @SequenceOrder,
               @TotalDistanceKm, @TotalDurationMinutes, @TotalWeightKg, @TotalVolumeM3,
               FALSE, @CreatedAt, @CreatedBy)",
            route);
    }

    public async Task CreateStopAsync(RouteStop stop)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.route_stops
              (id, tenant_id, route_id, shipment_id, stop_order, stop_type, address,
               lat, lng, arrival_time, departure_time, time_window_start, time_window_end,
               service_time_minutes, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @RouteId, @ShipmentId, @StopOrder, @StopType, @Address,
               @Lat, @Lng, @ArrivalTime, @DepartureTime, @TimeWindowStart, @TimeWindowEnd,
               @ServiceTimeMinutes, FALSE, @CreatedAt, @CreatedBy)",
            stop);
    }

    public async Task<IEnumerable<OptimizedRoute>> GetRoutesByOptimizationIdAsync(Guid optimizationId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<OptimizedRoute>(
            @"SELECT * FROM logistics.optimized_routes
              WHERE optimization_id = @OptimizationId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY sequence_order",
            new { OptimizationId = optimizationId, TenantId = tenantId });
    }

    public async Task<IEnumerable<RouteStop>> GetStopsByRouteIdAsync(Guid routeId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<RouteStop>(
            @"SELECT * FROM logistics.route_stops
              WHERE route_id = @RouteId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY stop_order",
            new { RouteId = routeId, TenantId = tenantId });
    }
}
