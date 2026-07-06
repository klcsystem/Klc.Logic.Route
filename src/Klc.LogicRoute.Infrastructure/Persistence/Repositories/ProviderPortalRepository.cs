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

    public async Task<Guid> ResolveProviderIdAsync(Guid tenantId, Guid providerId)
    {
        if (providerId != Guid.Empty) return providerId;
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        // Frontend providerId gondermedigi icin tenant'in ilk (en eski) saglayicisini kullan.
        return await conn.ExecuteScalarAsync<Guid>(
            @"SELECT id FROM logistics.providers
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY created_at LIMIT 1",
            new { TenantId = tenantId });
    }

    public async Task<IEnumerable<ProviderTariffRow>> GetTariffAsync(Guid tenantId, Guid providerId, string vehicleType)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<ProviderTariffRow>(
            @"SELECT id AS Id, km_from AS KmFrom, km_to AS KmTo, price AS Price
              FROM logistics.provider_tariffs
              WHERE tenant_id = @TenantId AND provider_id = @ProviderId
                AND vehicle_type = @VehicleType AND is_deleted = FALSE
              ORDER BY km_from",
            new { TenantId = tenantId, ProviderId = providerId, VehicleType = vehicleType });
    }

    public async Task SaveTariffAsync(Guid tenantId, Guid providerId, string vehicleType, IEnumerable<ProviderTariffRow> rows, string? userId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();

        // Tam-degistirme (full replace): editor her seferinde tum satirlari gonderir.
        await conn.ExecuteAsync(
            @"DELETE FROM logistics.provider_tariffs
              WHERE tenant_id = @TenantId AND provider_id = @ProviderId AND vehicle_type = @VehicleType",
            new { TenantId = tenantId, ProviderId = providerId, VehicleType = vehicleType }, tx);

        var toInsert = rows
            .Select(r => new
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ProviderId = providerId,
                VehicleType = vehicleType,
                r.KmFrom,
                r.KmTo,
                r.Price,
                CreatedBy = userId
            })
            .ToList();

        if (toInsert.Count > 0)
        {
            await conn.ExecuteAsync(
                @"INSERT INTO logistics.provider_tariffs
                  (id, tenant_id, provider_id, vehicle_type, km_from, km_to, price, is_deleted, created_at, created_by)
                  VALUES (@Id, @TenantId, @ProviderId, @VehicleType, @KmFrom, @KmTo, @Price, FALSE, NOW(), @CreatedBy)",
                toInsert, tx);
        }

        await tx.CommitAsync();
    }

    public async Task<IEnumerable<ProviderUser>> GetUsersAsync(Guid tenantId, Guid providerId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<ProviderUser>(
            @"SELECT id AS Id, name AS Name, email AS Email, role AS Role, is_active AS Active
              FROM logistics.provider_users
              WHERE tenant_id = @TenantId AND provider_id = @ProviderId AND is_deleted = FALSE
              ORDER BY created_at",
            new { TenantId = tenantId, ProviderId = providerId });
    }

    public async Task<ProviderUser> CreateUserAsync(Guid tenantId, Guid providerId, string name, string email, string role, bool active, string? userId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var id = Guid.NewGuid();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.provider_users
              (id, tenant_id, provider_id, name, email, role, is_active, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @ProviderId, @Name, @Email, @Role, @Active, FALSE, NOW(), @CreatedBy)",
            new { Id = id, TenantId = tenantId, ProviderId = providerId, Name = name, Email = email, Role = role, Active = active, CreatedBy = userId });
        return new ProviderUser(id, name, email, role, active);
    }

    public async Task<ProviderUser?> UpdateUserAsync(Guid tenantId, Guid id, string name, string email, string role, bool active, string? userId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var affected = await conn.ExecuteAsync(
            @"UPDATE logistics.provider_users
              SET name = @Name, email = @Email, role = @Role, is_active = @Active,
                  updated_at = NOW(), updated_by = @UpdatedBy
              WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId, Name = name, Email = email, Role = role, Active = active, UpdatedBy = userId });
        return affected > 0 ? new ProviderUser(id, name, email, role, active) : null;
    }

    public async Task DeleteUserAsync(Guid tenantId, Guid id, string? userId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.provider_users
              SET is_deleted = TRUE, updated_at = NOW(), updated_by = @UpdatedBy
              WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, UpdatedBy = userId });
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
