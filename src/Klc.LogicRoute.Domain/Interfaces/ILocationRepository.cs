using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface ILocationRepository
{
    Task<List<Location>> GetAllAsync(Guid tenantId);
    Task<Location?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> InsertAsync(Location location);
    Task UpdateAsync(Location location);
    Task DeleteAsync(Guid id, Guid tenantId);
}
