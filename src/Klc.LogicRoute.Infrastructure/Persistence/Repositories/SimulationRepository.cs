using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class SimulationRepository(IPostgresConnectionFactory connectionFactory) : ISimulationRepository
{
    public async Task<SimulationScenario?> GetScenarioByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<SimulationScenario>(
            @"SELECT * FROM logistics.simulation_scenarios
              WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<IEnumerable<SimulationScenario>> GetAllScenariosAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<SimulationScenario>(
            @"SELECT * FROM logistics.simulation_scenarios
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY created_at DESC",
            new { TenantId = tenantId });
    }

    public async Task<Guid> CreateScenarioAsync(SimulationScenario scenario)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.simulation_scenarios
              (id, tenant_id, name, description, base_snapshot, modifications, status,
               is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @Name, @Description, @BaseSnapshot, @Modifications, @Status,
               FALSE, @CreatedAt, @CreatedBy)",
            scenario);
        return scenario.Id;
    }

    public async Task UpdateScenarioAsync(SimulationScenario scenario)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.simulation_scenarios
              SET status = @Status, base_snapshot = @BaseSnapshot, updated_at = @UpdatedAt
              WHERE id = @Id AND tenant_id = @TenantId",
            scenario);
    }

    public async Task<SimulationResult?> GetResultByScenarioIdAsync(Guid scenarioId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<SimulationResult>(
            @"SELECT * FROM logistics.simulation_results
              WHERE scenario_id = @ScenarioId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY created_at DESC LIMIT 1",
            new { ScenarioId = scenarioId, TenantId = tenantId });
    }

    public async Task<Guid> CreateResultAsync(SimulationResult result)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.simulation_results
              (id, tenant_id, scenario_id, total_cost, total_distance_km, total_duration_hours,
               vehicle_utilization_pct, on_time_prediction_pct, co2_total_kg, unserved_shipments,
               cost_delta_pct, details, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @ScenarioId, @TotalCost, @TotalDistanceKm, @TotalDurationHours,
               @VehicleUtilizationPct, @OnTimePredictionPct, @Co2TotalKg, @UnservedShipments,
               @CostDeltaPct, @Details, FALSE, @CreatedAt, @CreatedBy)",
            result);
        return result.Id;
    }
}
