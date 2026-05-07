using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class DriverLocationRepository(IPostgresConnectionFactory connectionFactory) : IDriverLocationRepository
{
    public async Task CreateBatchAsync(IEnumerable<DriverLocation> locations)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        foreach (var loc in locations)
        {
            await conn.ExecuteAsync(
                @"INSERT INTO logistics.driver_locations
                  (id, tenant_id, driver_id, shipment_id, lat, lng, speed, heading, accuracy, recorded_at,
                   is_deleted, created_at, created_by)
                  VALUES (@Id, @TenantId, @DriverId, @ShipmentId, @Lat, @Lng, @Speed, @Heading, @Accuracy,
                   @RecordedAt, FALSE, @CreatedAt, @CreatedBy)",
                loc);
        }
    }

    public async Task<DriverLocation?> GetLatestByDriverAsync(Guid driverId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<DriverLocation>(
            @"SELECT * FROM logistics.driver_locations
              WHERE driver_id = @DriverId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY recorded_at DESC LIMIT 1",
            new { DriverId = driverId, TenantId = tenantId });
    }
}
