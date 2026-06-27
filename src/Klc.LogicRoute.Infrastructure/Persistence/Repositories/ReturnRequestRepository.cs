using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class ReturnRequestRepository(IPostgresConnectionFactory connectionFactory) : IReturnRequestRepository
{
    public async Task<List<ReturnRequest>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        var result = await conn.QueryAsync<ReturnRequest>(
            @"SELECT * FROM logistics.return_requests
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY requested_at DESC
              LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
        return result.ToList();
    }

    public async Task<ReturnRequest?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<ReturnRequest>(
            "SELECT * FROM logistics.return_requests WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(ReturnRequest returnRequest)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        returnRequest.Id = Guid.NewGuid();
        returnRequest.CreatedAt = DateTime.UtcNow;
        returnRequest.RequestedAt = DateTime.UtcNow;
        await conn.ExecuteAsync(@"
            INSERT INTO logistics.return_requests
                (id, tenant_id, original_shipment_id, order_id, reason, status,
                 pickup_address, pickup_lat, pickup_lng, requested_at, pickup_date, received_at, notes,
                 is_deleted, created_at, created_by)
            VALUES
                (@Id, @TenantId, @OriginalShipmentId, @OrderId, @Reason, @Status,
                 @PickupAddress, @PickupLat, @PickupLng, @RequestedAt, @PickupDate, @ReceivedAt, @Notes,
                 FALSE, @CreatedAt, @CreatedBy)", returnRequest);
        return returnRequest.Id;
    }

    public async Task UpdateStatusAsync(Guid id, Guid tenantId, string status, DateTime? receivedAt = null)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"
            UPDATE logistics.return_requests
            SET status = @Status, received_at = COALESCE(@ReceivedAt, received_at), updated_at = @Now
            WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Status = status, ReceivedAt = receivedAt, Now = DateTime.UtcNow });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.return_requests SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }
}
