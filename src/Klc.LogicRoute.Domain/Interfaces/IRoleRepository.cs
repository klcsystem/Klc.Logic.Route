using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IRoleRepository
{
    Task<OperationClaim?> GetByIdAsync(Guid id, Guid tenantId);
    Task<OperationClaim?> GetByNameAsync(string name, Guid tenantId);
    Task<IEnumerable<OperationClaim>> GetAllAsync(Guid tenantId);
    Task<Guid> InsertAsync(OperationClaim role);
    Task UpdateAsync(OperationClaim role);
    Task DeleteAsync(Guid id, Guid tenantId);
    Task<IEnumerable<string>> GetPermissionsAsync(Guid roleId);
    Task SetPermissionsAsync(Guid roleId, IEnumerable<string> permissions);
}
