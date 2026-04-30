using Dapper;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class DashboardRepository(IPostgresConnectionFactory connectionFactory) : IDashboardRepository
{
    public async Task<int> GetOrderCountAsync(Guid tenantId, int? status = null)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var sql = "SELECT COUNT(*) FROM logistics.orders WHERE tenant_id = @TenantId AND is_deleted = FALSE";
        if (status.HasValue) sql += " AND status = @Status";
        return await conn.ExecuteScalarAsync<int>(sql, new { TenantId = tenantId, Status = status });
    }

    public async Task<int> GetShipmentCountAsync(Guid tenantId, int? status = null)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var sql = "SELECT COUNT(*) FROM logistics.shipments WHERE tenant_id = @TenantId AND is_deleted = FALSE";
        if (status.HasValue) sql += " AND status = @Status";
        return await conn.ExecuteScalarAsync<int>(sql, new { TenantId = tenantId, Status = status });
    }

    public async Task<int> GetProviderCountAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM logistics.providers WHERE tenant_id = @TenantId AND is_deleted = FALSE AND is_active = TRUE",
            new { TenantId = tenantId });
    }

    public async Task<int> GetActiveContractCountAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM logistics.contracts WHERE tenant_id = @TenantId AND is_deleted = FALSE AND status = 1 AND end_date >= @Now",
            new { TenantId = tenantId, Now = DateTime.UtcNow });
    }

    public async Task<decimal> GetTotalShipmentCostAsync(Guid tenantId, int? year = null, int? month = null)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var sql = "SELECT COALESCE(SUM(total_cost), 0) FROM logistics.shipments WHERE tenant_id = @TenantId AND is_deleted = FALSE";
        if (year.HasValue) sql += " AND EXTRACT(YEAR FROM created_at) = @Year";
        if (month.HasValue) sql += " AND EXTRACT(MONTH FROM created_at) = @Month";
        return await conn.ExecuteScalarAsync<decimal>(sql, new { TenantId = tenantId, Year = year, Month = month });
    }

    public async Task<decimal> GetAverageDeliveryHoursAsync(Guid tenantId, int? year = null, int? month = null)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (actual_delivery_date - actual_pickup_date)) / 3600), 0)
                    FROM logistics.shipments WHERE tenant_id = @TenantId AND is_deleted = FALSE
                    AND actual_delivery_date IS NOT NULL AND actual_pickup_date IS NOT NULL";
        if (year.HasValue) sql += " AND EXTRACT(YEAR FROM created_at) = @Year";
        if (month.HasValue) sql += " AND EXTRACT(MONTH FROM created_at) = @Month";
        return await conn.ExecuteScalarAsync<decimal>(sql, new { TenantId = tenantId, Year = year, Month = month });
    }

    public async Task<IEnumerable<MonthlyCostSummary>> GetMonthlyCostsAsync(Guid tenantId, int year)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<MonthlyCostSummary>(
            @"SELECT EXTRACT(MONTH FROM created_at)::INT AS month,
              COALESCE(SUM(total_cost), 0) AS total_cost,
              COUNT(*) AS shipment_count
              FROM logistics.shipments
              WHERE tenant_id = @TenantId AND is_deleted = FALSE AND EXTRACT(YEAR FROM created_at) = @Year
              GROUP BY EXTRACT(MONTH FROM created_at)
              ORDER BY month",
            new { TenantId = tenantId, Year = year });
    }

    public async Task<IEnumerable<ProviderCostSummary>> GetProviderCostsAsync(Guid tenantId, int? year = null, int? month = null)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT s.provider_id, p.name AS provider_name,
              COALESCE(SUM(s.total_cost), 0) AS total_cost, COUNT(*) AS shipment_count
              FROM logistics.shipments s
              JOIN logistics.providers p ON s.provider_id = p.id
              WHERE s.tenant_id = @TenantId AND s.is_deleted = FALSE";
        if (year.HasValue) sql += " AND EXTRACT(YEAR FROM s.created_at) = @Year";
        if (month.HasValue) sql += " AND EXTRACT(MONTH FROM s.created_at) = @Month";
        sql += " GROUP BY s.provider_id, p.name ORDER BY total_cost DESC";
        return await conn.QueryAsync<ProviderCostSummary>(sql, new { TenantId = tenantId, Year = year, Month = month });
    }
}
