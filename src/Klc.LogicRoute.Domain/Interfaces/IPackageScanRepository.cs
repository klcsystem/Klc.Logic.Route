using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IPackageScanRepository
{
    Task<Guid> CreateAsync(PackageScan scan);
    Task<IEnumerable<PackageScan>> GetByShipmentIdAsync(Guid shipmentId, Guid tenantId);
    Task<PackageScan?> GetByIdAsync(Guid id, Guid tenantId);
}
