using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.RoutingRules;

public class RoutingRuleEngine(IRoutingRuleRepository routingRuleRepository) : IRoutingRuleEngine
{
    public async Task<RoutingRule?> FindMatchingRuleAsync(Order order, Guid tenantId)
    {
        var rules = await routingRuleRepository.GetAllAsync(tenantId);
        var activeRules = rules.Where(r => r.IsActive).OrderBy(r => r.Priority);

        foreach (var rule in activeRules)
        {
            if (Matches(rule, order))
                return rule;
        }

        return null;
    }

    public static bool Matches(RoutingRule rule, Order order)
    {
        // Kural bölge bazlı (Marmara), sipariş şehir bazlı (Bursa) — şehir→bölge çözerek eşleştir
        if (!string.IsNullOrEmpty(rule.OriginRegion) && !RegionResolver.RegionMatches(rule.OriginRegion, order.OriginCity))
            return false;

        if (!string.IsNullOrEmpty(rule.DestinationRegion) && !RegionResolver.RegionMatches(rule.DestinationRegion, order.DestinationCity))
            return false;

        if (rule.MinWeightKg.HasValue && order.TotalWeightKg < rule.MinWeightKg.Value)
            return false;

        if (rule.MaxWeightKg.HasValue && order.TotalWeightKg > rule.MaxWeightKg.Value)
            return false;

        if (rule.IsHazardous.HasValue && order.IsHazardous != rule.IsHazardous.Value)
            return false;

        if (rule.RequiresColdChain.HasValue && order.RequiresColdChain != rule.RequiresColdChain.Value)
            return false;

        return true;
    }
}
