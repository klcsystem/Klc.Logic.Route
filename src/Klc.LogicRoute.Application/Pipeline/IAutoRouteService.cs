namespace Klc.LogicRoute.Application.Pipeline;

public interface IAutoRouteService
{
    /// <summary>
    /// Takes a batch of order IDs, runs VRP optimization, and persists the result.
    /// Returns the optimization result ID.
    /// </summary>
    Task<Guid> OptimizeAsync(List<Guid> orderIds, Guid tenantId, CancellationToken cancellationToken = default);
}
