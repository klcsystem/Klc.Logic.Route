using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class CarrierPerformanceRepository(IPostgresConnectionFactory connectionFactory) : ICarrierPerformanceRepository
{
    public async Task<IEnumerable<CarrierPerformance>> GetAllAsync(Guid tenantId, int? year = null, int? month = null)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var sql = "SELECT * FROM logistics.carrier_performance WHERE tenant_id = @TenantId";
        if (year.HasValue) sql += " AND year = @Year";
        if (month.HasValue) sql += " AND month = @Month";
        sql += " ORDER BY overall_score DESC";
        return await conn.QueryAsync<CarrierPerformance>(sql,
            new { TenantId = tenantId, Year = year, Month = month });
    }

    public async Task<CarrierPerformance?> GetByProviderAsync(Guid providerId, Guid tenantId, int year, int month)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<CarrierPerformance>(
            "SELECT * FROM logistics.carrier_performance WHERE provider_id = @ProviderId AND tenant_id = @TenantId AND year = @Year AND month = @Month",
            new { ProviderId = providerId, TenantId = tenantId, Year = year, Month = month });
    }

    public async Task InsertAsync(CarrierPerformance performance)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.carrier_performance (id, tenant_id, provider_id, provider_name, period, year, month,
              total_shipments, on_time_deliveries, late_deliveries, damaged_shipments, cancelled_shipments,
              on_time_percentage, average_delivery_hours, total_cost, average_cost_per_kg,
              co2_total_kg, overall_score, calculated_at, created_at)
              VALUES (@Id, @TenantId, @ProviderId, @ProviderName, @Period, @Year, @Month,
              @TotalShipments, @OnTimeDeliveries, @LateDeliveries, @DamagedShipments, @CancelledShipments,
              @OnTimePercentage, @AverageDeliveryHours, @TotalCost, @AverageCostPerKg,
              @CO2TotalKg, @OverallScore, @CalculatedAt, @CreatedAt)",
            new { performance.Id, performance.TenantId, performance.ProviderId, performance.ProviderName,
                performance.Period, performance.Year, performance.Month,
                performance.TotalShipments, performance.OnTimeDeliveries, performance.LateDeliveries,
                performance.DamagedShipments, performance.CancelledShipments,
                performance.OnTimePercentage, performance.AverageDeliveryHours, performance.TotalCost,
                performance.AverageCostPerKg, performance.CO2TotalKg, performance.OverallScore,
                performance.CalculatedAt, performance.CreatedAt });
    }

    public async Task UpdateAsync(CarrierPerformance performance)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.carrier_performance SET total_shipments = @TotalShipments,
              on_time_deliveries = @OnTimeDeliveries, late_deliveries = @LateDeliveries,
              damaged_shipments = @DamagedShipments, cancelled_shipments = @CancelledShipments,
              on_time_percentage = @OnTimePercentage, average_delivery_hours = @AverageDeliveryHours,
              total_cost = @TotalCost, average_cost_per_kg = @AverageCostPerKg,
              co2_total_kg = @CO2TotalKg, overall_score = @OverallScore, calculated_at = @CalculatedAt
              WHERE id = @Id AND tenant_id = @TenantId",
            new { performance.Id, performance.TenantId, performance.TotalShipments,
                performance.OnTimeDeliveries, performance.LateDeliveries,
                performance.DamagedShipments, performance.CancelledShipments,
                performance.OnTimePercentage, performance.AverageDeliveryHours, performance.TotalCost,
                performance.AverageCostPerKg, performance.CO2TotalKg, performance.OverallScore,
                performance.CalculatedAt });
    }
}
