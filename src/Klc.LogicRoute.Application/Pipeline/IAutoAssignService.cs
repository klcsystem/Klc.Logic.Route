namespace Klc.LogicRoute.Application.Pipeline;

public record AutoAssignSummary(
    Guid OptimizationId,
    int RoutesAssigned,
    int DriversNotified,
    int OrdersUpdated,
    List<string> Warnings);

public interface IAutoAssignService
{
    /// <summary>
    /// Assigns optimized routes to best-fit drivers and notifies them.
    /// Returns an assignment summary.
    /// </summary>
    Task<AutoAssignSummary> AssignAsync(Guid optimizationId, Guid tenantId, CancellationToken cancellationToken = default);
}
