using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class ProviderPortalRepository(IPostgresConnectionFactory connectionFactory) : IProviderPortalRepository
{
    public async Task<IEnumerable<Order>> GetOrdersByProviderAsync(Guid tenantId, Guid providerId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<Order>(
            @"SELECT * FROM logistics.orders
              WHERE tenant_id = @TenantId AND provider_id = @ProviderId AND is_deleted = FALSE
              ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, ProviderId = providerId, PageSize = pageSize, Offset = offset });
    }

    public async Task<int> GetOrderCountByProviderAsync(Guid tenantId, Guid providerId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM logistics.orders WHERE tenant_id = @TenantId AND provider_id = @ProviderId AND is_deleted = FALSE",
            new { TenantId = tenantId, ProviderId = providerId });
    }

    public async Task<IEnumerable<Vehicle>> GetVehiclesByProviderAsync(Guid tenantId, Guid providerId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<Vehicle>(
            @"SELECT * FROM logistics.vehicles
              WHERE tenant_id = @TenantId AND provider_id = @ProviderId AND is_deleted = FALSE
              ORDER BY created_at DESC",
            new { TenantId = tenantId, ProviderId = providerId });
    }

    public async Task<IEnumerable<Driver>> GetDriversByProviderAsync(Guid tenantId, Guid providerId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<Driver>(
            @"SELECT * FROM logistics.drivers
              WHERE tenant_id = @TenantId AND provider_id = @ProviderId AND is_deleted = FALSE
              ORDER BY full_name",
            new { TenantId = tenantId, ProviderId = providerId });
    }

    public async Task<IEnumerable<Shipment>> GetShipmentsByProviderAsync(Guid tenantId, Guid providerId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<Shipment>(
            @"SELECT * FROM logistics.shipments
              WHERE tenant_id = @TenantId AND selected_provider_id = @ProviderId AND is_deleted = FALSE
              ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, ProviderId = providerId, PageSize = pageSize, Offset = offset });
    }

    public async Task<int> GetShipmentCountByProviderAsync(Guid tenantId, Guid providerId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM logistics.shipments WHERE tenant_id = @TenantId AND selected_provider_id = @ProviderId AND is_deleted = FALSE",
            new { TenantId = tenantId, ProviderId = providerId });
    }

    public async Task<ProviderPortalStats> GetStatsAsync(Guid tenantId, Guid providerId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();

        var stats = new ProviderPortalStats
        {
            TotalOrders = await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM logistics.orders WHERE tenant_id = @TenantId AND provider_id = @ProviderId AND is_deleted = FALSE",
                new { TenantId = tenantId, ProviderId = providerId }),

            PendingOrders = await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM logistics.orders WHERE tenant_id = @TenantId AND provider_id = @ProviderId AND is_deleted = FALSE AND status = 0",
                new { TenantId = tenantId, ProviderId = providerId }),

            ActiveShipments = await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM logistics.shipments WHERE tenant_id = @TenantId AND selected_provider_id = @ProviderId AND is_deleted = FALSE AND status NOT IN (5, 6)",
                new { TenantId = tenantId, ProviderId = providerId }),

            CompletedShipments = await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM logistics.shipments WHERE tenant_id = @TenantId AND selected_provider_id = @ProviderId AND is_deleted = FALSE AND status = 5",
                new { TenantId = tenantId, ProviderId = providerId }),

            TotalVehicles = await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM logistics.vehicles WHERE tenant_id = @TenantId AND provider_id = @ProviderId AND is_deleted = FALSE",
                new { TenantId = tenantId, ProviderId = providerId }),

            TotalDrivers = await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM logistics.drivers WHERE tenant_id = @TenantId AND provider_id = @ProviderId AND is_deleted = FALSE",
                new { TenantId = tenantId, ProviderId = providerId })
        };

        return stats;
    }
}
