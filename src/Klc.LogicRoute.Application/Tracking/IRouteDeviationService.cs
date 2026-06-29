using Klc.LogicRoute.Application.Tracking.Models;

namespace Klc.LogicRoute.Application.Tracking;

public interface IRouteDeviationService
{
    /// <summary>
    /// Checks if a driver's current position deviates from the planned route.
    /// Returns a DeviationAlert if the driver is too far from the route, null otherwise.
    /// </summary>
    Task<DeviationAlert?> CheckDeviationAsync(
        Guid driverId,
        Guid tenantId,
        double lat,
        double lng,
        Guid? shipmentId);
}
