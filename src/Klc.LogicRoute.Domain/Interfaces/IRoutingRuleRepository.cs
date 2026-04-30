using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IRoutingRuleRepository
{
    Task<IEnumerable<RoutingRule>> GetAllAsync(Guid tenantId);
    Task<RoutingRule?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> InsertAsync(RoutingRule rule);
    Task UpdateAsync(RoutingRule rule);
    Task DeleteAsync(Guid id, Guid tenantId);
}
