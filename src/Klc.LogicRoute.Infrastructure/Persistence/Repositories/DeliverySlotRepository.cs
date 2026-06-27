using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class DeliverySlotRepository(IPostgresConnectionFactory connectionFactory) : IDeliverySlotRepository
{
    public async Task<Guid> CreateAsync(DeliverySlot slot)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.delivery_slots
              (id, tenant_id, order_id, shipment_id, date, start_time, end_time,
               customer_name, customer_phone, zip_code, status,
               reserved_at, confirmed_at, expires_at,
               is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @OrderId, @ShipmentId, @Date, @StartTime, @EndTime,
               @CustomerName, @CustomerPhone, @ZipCode, @Status,
               @ReservedAt, @ConfirmedAt, @ExpiresAt,
               FALSE, @CreatedAt, @CreatedBy)",
            slot);
        return slot.Id;
    }

    public async Task<DeliverySlot?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<DeliverySlot>(
            @"SELECT * FROM logistics.delivery_slots
              WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<IEnumerable<DeliverySlot>> GetAvailableAsync(Guid tenantId, DateOnly date, string? zipCode)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();

        var sql = @"SELECT * FROM logistics.delivery_slots
                    WHERE tenant_id = @TenantId AND date = @Date AND status = @Status AND is_deleted = FALSE";

        if (!string.IsNullOrWhiteSpace(zipCode))
            sql += " AND zip_code = @ZipCode";

        sql += " ORDER BY start_time";

        return await conn.QueryAsync<DeliverySlot>(sql,
            new { TenantId = tenantId, Date = date, Status = (int)DeliverySlotStatus.Available, ZipCode = zipCode });
    }

    public async Task UpdateStatusAsync(Guid id, Guid tenantId, DeliverySlotStatus status)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.delivery_slots
              SET status = @Status, updated_at = NOW()
              WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId, Status = (int)status });
    }

    public async Task ReserveAsync(Guid id, Guid tenantId, string customerName, string customerPhone, DateTime expiresAt)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.delivery_slots
              SET status = @Status, customer_name = @CustomerName, customer_phone = @CustomerPhone,
                  reserved_at = NOW(), expires_at = @ExpiresAt, updated_at = NOW()
              WHERE id = @Id AND tenant_id = @TenantId AND status = @AvailableStatus AND is_deleted = FALSE",
            new
            {
                Id = id,
                TenantId = tenantId,
                Status = (int)DeliverySlotStatus.Reserved,
                AvailableStatus = (int)DeliverySlotStatus.Available,
                CustomerName = customerName,
                CustomerPhone = customerPhone,
                ExpiresAt = expiresAt
            });
    }

    public async Task ConfirmAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.delivery_slots
              SET status = @Status, confirmed_at = NOW(), updated_at = NOW()
              WHERE id = @Id AND tenant_id = @TenantId AND status = @ReservedStatus AND is_deleted = FALSE",
            new
            {
                Id = id,
                TenantId = tenantId,
                Status = (int)DeliverySlotStatus.Confirmed,
                ReservedStatus = (int)DeliverySlotStatus.Reserved
            });
    }
}
