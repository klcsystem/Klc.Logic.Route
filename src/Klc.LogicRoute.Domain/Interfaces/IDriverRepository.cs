using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IDriverRepository
{
    Task<List<Driver>> GetAllAsync(Guid tenantId, Guid? providerId = null);
    Task<Driver?> GetByIdAsync(Guid id);
    Task<Guid> InsertAsync(Driver driver);
    Task UpdateAsync(Driver driver);
    Task DeleteAsync(Guid id);
}
