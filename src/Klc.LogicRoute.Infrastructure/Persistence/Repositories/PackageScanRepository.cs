using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class PackageScanRepository(IPostgresConnectionFactory connectionFactory) : IPackageScanRepository
{
    public async Task<Guid> CreateAsync(PackageScan scan)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.package_scans
              (id, tenant_id, shipment_id, order_id, driver_id, barcode_value, scan_type,
               scanned_at, lat, lng, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @ShipmentId, @OrderId, @DriverId, @BarcodeValue, @ScanType,
               @ScannedAt, @Lat, @Lng, FALSE, @CreatedAt, @CreatedBy)",
            scan);
        return scan.Id;
    }

    public async Task<IEnumerable<PackageScan>> GetByShipmentIdAsync(Guid shipmentId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<PackageScan>(
            @"SELECT * FROM logistics.package_scans
              WHERE shipment_id = @ShipmentId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY scanned_at DESC",
            new { ShipmentId = shipmentId, TenantId = tenantId });
    }

    public async Task<PackageScan?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<PackageScan>(
            @"SELECT * FROM logistics.package_scans
              WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
    }
}
