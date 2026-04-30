using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Application.RoutingRules;

public interface IRoutingRuleEngine
{
    Task<RoutingRule?> FindMatchingRuleAsync(Order order, Guid tenantId);
}
