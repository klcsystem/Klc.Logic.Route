using Klc.LogicRoute.Application.TerritoryPlanning.Models;

namespace Klc.LogicRoute.Application.TerritoryPlanning;

public interface ITerritoryPlanningService
{
    /// <summary>
    /// Runs K-means clustering on delivery points to create geographic zones.
    /// </summary>
    Task<TerritoryPlanResult> PlanAsync(List<DeliveryPoint> points, int zoneCount, TerritoryPlanRequest options);
}
