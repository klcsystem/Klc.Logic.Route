using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class DriverMessageRepository(IPostgresConnectionFactory connectionFactory) : IDriverMessageRepository
{
    public async Task<Guid> CreateAsync(DriverMessage message)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.driver_messages
              (id, tenant_id, shipment_id, sender_id, sender_type, message, read_at,
               is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @ShipmentId, @SenderId, @SenderType, @Message, @ReadAt,
               FALSE, @CreatedAt, @CreatedBy)",
            message);
        return message.Id;
    }

    public async Task<IEnumerable<DriverMessage>> GetByShipmentIdAsync(Guid shipmentId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<DriverMessage>(
            @"SELECT * FROM logistics.driver_messages
              WHERE shipment_id = @ShipmentId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY created_at ASC",
            new { ShipmentId = shipmentId, TenantId = tenantId });
    }

    public async Task MarkAsReadAsync(Guid messageId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.driver_messages
              SET read_at = @Now, updated_at = @Now
              WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = messageId, TenantId = tenantId, Now = DateTime.UtcNow });
    }
}
