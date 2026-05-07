using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IRouteOptimizationRepository
{
    Task<RouteOptimizationResult?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<RouteOptimizationResult>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 20);
    Task<Guid> CreateAsync(RouteOptimizationResult result);
    Task UpdateAsync(RouteOptimizationResult result);
    Task CreateRouteAsync(OptimizedRoute route);
    Task CreateStopAsync(RouteStop stop);
    Task<IEnumerable<OptimizedRoute>> GetRoutesByOptimizationIdAsync(Guid optimizationId, Guid tenantId);
    Task<IEnumerable<RouteStop>> GetStopsByRouteIdAsync(Guid routeId, Guid tenantId);
}
