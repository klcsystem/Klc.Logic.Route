using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class CrossDockRepository(IPostgresConnectionFactory connectionFactory) : ICrossDockRepository
{
    public async Task<CrossDockOperation?> GetByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<CrossDockOperation>(
            "SELECT * FROM logistics.cross_dock_operations WHERE id = @Id AND is_deleted = FALSE",
            new { Id = id });
    }

    public async Task<IEnumerable<CrossDockOperation>> GetByTenantAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<CrossDockOperation>(
            @"SELECT * FROM logistics.cross_dock_operations
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY transfer_date DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<IEnumerable<CrossDockOperation>> GetByHubAsync(string hubName, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<CrossDockOperation>(
            @"SELECT * FROM logistics.cross_dock_operations
              WHERE tenant_id = @TenantId AND LOWER(hub_name) = LOWER(@HubName) AND is_deleted = FALSE
              ORDER BY transfer_date DESC LIMIT 100",
            new { TenantId = tenantId, HubName = hubName });
    }

    public async Task<Guid> InsertAsync(CrossDockOperation op)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.cross_dock_operations
              (id, tenant_id, hub_name, hub_lat, hub_lng, inbound_vehicle_id, outbound_vehicle_id,
               transfer_date, status, items, notes, created_by, created_at)
              VALUES (@Id, @TenantId, @HubName, @HubLat, @HubLng, @InboundVehicleId, @OutboundVehicleId,
               @TransferDate, @Status, @Items, @Notes, @CreatedBy, @CreatedAt)",
            new
            {
                op.Id, op.TenantId, op.HubName, op.HubLat, op.HubLng,
                op.InboundVehicleId, op.OutboundVehicleId, op.TransferDate,
                Status = (int)op.Status, op.Items, op.Notes, op.CreatedBy, op.CreatedAt
            });
        return op.Id;
    }

    public async Task UpdateStatusAsync(Guid id, int status)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.cross_dock_operations SET status = @Status, updated_at = @Now WHERE id = @Id",
            new { Id = id, Status = status, Now = DateTime.UtcNow });
    }

    public async Task UpdateAsync(CrossDockOperation op)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.cross_dock_operations SET
              hub_name = @HubName, hub_lat = @HubLat, hub_lng = @HubLng,
              inbound_vehicle_id = @InboundVehicleId, outbound_vehicle_id = @OutboundVehicleId,
              transfer_date = @TransferDate, status = @Status, items = @Items, notes = @Notes,
              updated_by = @UpdatedBy, updated_at = @Now
              WHERE id = @Id",
            new
            {
                op.Id, op.HubName, op.HubLat, op.HubLng,
                op.InboundVehicleId, op.OutboundVehicleId, op.TransferDate,
                Status = (int)op.Status, op.Items, op.Notes, op.UpdatedBy, Now = DateTime.UtcNow
            });
    }
}
