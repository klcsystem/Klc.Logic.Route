using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class ProofOfDeliveryRepository(IPostgresConnectionFactory connectionFactory) : IProofOfDeliveryRepository
{
    public async Task<Guid> CreateAsync(ProofOfDelivery pod)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.proof_of_delivery
              (id, tenant_id, shipment_id, photo_path, signature_path, recipient_name, notes,
               lat, lng, captured_at, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @ShipmentId, @PhotoPath, @SignaturePath, @RecipientName, @Notes,
               @Lat, @Lng, @CapturedAt, FALSE, @CreatedAt, @CreatedBy)",
            pod);
        return pod.Id;
    }

    public async Task<ProofOfDelivery?> GetByShipmentIdAsync(Guid shipmentId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<ProofOfDelivery>(
            @"SELECT * FROM logistics.proof_of_delivery
              WHERE shipment_id = @ShipmentId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY created_at DESC LIMIT 1",
            new { ShipmentId = shipmentId, TenantId = tenantId });
    }
}
