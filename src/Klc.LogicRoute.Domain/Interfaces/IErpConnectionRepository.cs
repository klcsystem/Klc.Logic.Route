using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IErpConnectionRepository
{
    Task<ErpConnection?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<ErpConnection>> GetAllAsync(Guid tenantId);
    Task<Guid> InsertAsync(ErpConnection connection);
    Task UpdateAsync(ErpConnection connection);
    Task DeleteAsync(Guid id, Guid tenantId);
    Task UpdateSyncStatusAsync(Guid id, Guid tenantId, string status);
}
