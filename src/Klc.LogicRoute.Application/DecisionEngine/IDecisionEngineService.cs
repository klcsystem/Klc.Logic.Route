using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Application.DecisionEngine;

public interface IDecisionEngineService
{
    Task<Recommendation> CalculateBestOptionAsync(Shipment shipment, DecisionCriteria criteria, Guid tenantId);
}

public class DecisionCriteria
{
    public decimal PriceWeight { get; set; } = 0.6m;
    public decimal SpeedWeight { get; set; } = 0.25m;
    public decimal ReliabilityWeight { get; set; } = 0.15m;
}
