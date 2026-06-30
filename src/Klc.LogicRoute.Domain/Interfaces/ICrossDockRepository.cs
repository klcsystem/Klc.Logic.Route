using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface ICrossDockRepository
{
    Task<CrossDockOperation?> GetByIdAsync(Guid id);
    Task<IEnumerable<CrossDockOperation>> GetByTenantAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<IEnumerable<CrossDockOperation>> GetByHubAsync(string hubName, Guid tenantId);
    Task<Guid> InsertAsync(CrossDockOperation operation);
    Task UpdateStatusAsync(Guid id, int status);
    Task UpdateAsync(CrossDockOperation operation);
}
