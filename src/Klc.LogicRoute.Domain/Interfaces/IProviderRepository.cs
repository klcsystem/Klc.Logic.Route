using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IProviderRepository
{
    Task<Provider?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<Provider>> GetAllAsync(Guid tenantId);
    Task<Guid> InsertAsync(Provider provider);
    Task UpdateAsync(Provider provider);
    Task DeleteAsync(Guid id, Guid tenantId);
}
