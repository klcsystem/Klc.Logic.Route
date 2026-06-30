using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface ICarrierNetworkRepository
{
    Task<CarrierNetwork?> GetByIdAsync(Guid id);
    Task<IEnumerable<CarrierNetwork>> GetByTenantAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<IEnumerable<CarrierNetwork>> GetActiveByRegionAsync(Guid tenantId, string region);
    Task<Guid> InsertAsync(CarrierNetwork carrier);
    Task UpdateAsync(CarrierNetwork carrier);
    Task DeleteAsync(Guid id);
}
