using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class CustomerTrackingRepository(IPostgresConnectionFactory connectionFactory) : ICustomerTrackingRepository
{
    public async Task<CustomerTracking?> GetByTokenAsync(string token)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<CustomerTracking>(
            @"SELECT * FROM logistics.customer_tracking
              WHERE tracking_token = @Token AND is_active = TRUE AND is_deleted = FALSE",
            new { Token = token });
    }

    public async Task<CustomerTracking?> GetByShipmentIdAsync(Guid shipmentId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<CustomerTracking>(
            @"SELECT * FROM logistics.customer_tracking
              WHERE shipment_id = @ShipmentId AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { ShipmentId = shipmentId, TenantId = tenantId });
    }

    public async Task<Guid> CreateAsync(CustomerTracking tracking)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.customer_tracking
              (id, tenant_id, shipment_id, tracking_token, customer_name, customer_phone,
               customer_email, estimated_arrival, last_eta_update, is_active, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @ShipmentId, @TrackingToken, @CustomerName, @CustomerPhone,
               @CustomerEmail, @EstimatedArrival, @LastEtaUpdate, @IsActive, FALSE, @CreatedAt, @CreatedBy)",
            tracking);
        return tracking.Id;
    }

    public async Task UpdateEtaAsync(Guid id, DateTime estimatedArrival)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.customer_tracking
              SET estimated_arrival = @Eta, last_eta_update = @Now, updated_at = @Now
              WHERE id = @Id",
            new { Id = id, Eta = estimatedArrival, Now = DateTime.UtcNow });
    }
}
