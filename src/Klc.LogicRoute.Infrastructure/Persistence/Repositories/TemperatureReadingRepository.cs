using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class TemperatureReadingRepository(IPostgresConnectionFactory connectionFactory) : ITemperatureReadingRepository
{
    public async Task<TemperatureReading?> GetByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<TemperatureReading>(
            "SELECT * FROM logistics.temperature_readings WHERE id = @Id AND is_deleted = FALSE",
            new { Id = id });
    }

    public async Task<IEnumerable<TemperatureReading>> GetByShipmentAsync(Guid shipmentId, int page = 1, int pageSize = 100)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<TemperatureReading>(
            @"SELECT * FROM logistics.temperature_readings
              WHERE shipment_id = @ShipmentId AND is_deleted = FALSE
              ORDER BY reading_at DESC LIMIT @PageSize OFFSET @Offset",
            new { ShipmentId = shipmentId, PageSize = pageSize, Offset = offset });
    }

    public async Task<IEnumerable<TemperatureReading>> GetAlarmsAsync(Guid tenantId, DateTime? since = null, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        var sinceDate = since ?? DateTime.UtcNow.Date;
        return await conn.QueryAsync<TemperatureReading>(
            @"SELECT * FROM logistics.temperature_readings
              WHERE tenant_id = @TenantId AND is_alarm = TRUE AND reading_at >= @Since AND is_deleted = FALSE
              ORDER BY reading_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, Since = sinceDate, PageSize = pageSize, Offset = offset });
    }

    public async Task<Guid> InsertAsync(TemperatureReading r)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.temperature_readings
              (id, tenant_id, shipment_id, vehicle_id, sensor_id, temperature, humidity,
               lat, lng, reading_at, is_alarm, created_by, created_at)
              VALUES (@Id, @TenantId, @ShipmentId, @VehicleId, @SensorId, @Temperature, @Humidity,
               @Lat, @Lng, @ReadingAt, @IsAlarm, @CreatedBy, @CreatedAt)",
            new
            {
                r.Id, r.TenantId, r.ShipmentId, r.VehicleId, r.SensorId,
                r.Temperature, r.Humidity, r.Lat, r.Lng, r.ReadingAt, r.IsAlarm,
                r.CreatedBy, r.CreatedAt
            });
        return r.Id;
    }

    public async Task<(int TotalMonitored, int AlarmsToday, decimal AvgTemperature)> GetDashboardAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var today = DateTime.UtcNow.Date;

        var totalMonitored = await conn.ExecuteScalarAsync<int>(
            @"SELECT COUNT(DISTINCT shipment_id) FROM logistics.temperature_readings
              WHERE tenant_id = @TenantId AND is_deleted = FALSE",
            new { TenantId = tenantId });

        var alarmsToday = await conn.ExecuteScalarAsync<int>(
            @"SELECT COUNT(*) FROM logistics.temperature_readings
              WHERE tenant_id = @TenantId AND is_alarm = TRUE AND reading_at >= @Today AND is_deleted = FALSE",
            new { TenantId = tenantId, Today = today });

        var avgTemp = await conn.ExecuteScalarAsync<decimal?>(
            @"SELECT AVG(temperature) FROM logistics.temperature_readings
              WHERE tenant_id = @TenantId AND reading_at >= @Today AND is_deleted = FALSE",
            new { TenantId = tenantId, Today = today });

        return (totalMonitored, alarmsToday, avgTemp ?? 0);
    }
}
