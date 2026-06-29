using Klc.LogicRoute.Application.Safety.Models;

namespace Klc.LogicRoute.Application.Safety;

public interface IDriverWellnessService
{
    /// <summary>
    /// Gets the current wellness report for a specific driver.
    /// Tracks hours, breaks, and calculates safety score based on Turkish labor law.
    /// </summary>
    Task<WellnessReport> GetWellnessAsync(Guid driverId, Guid tenantId);

    /// <summary>
    /// Gets all drivers with Warning, Critical, or Blocked fatigue levels.
    /// </summary>
    Task<List<SafetyAlert>> GetActiveAlertsAsync(Guid tenantId);

    /// <summary>
    /// Gets fleet-wide safety dashboard summary.
    /// </summary>
    Task<SafetyDashboard> GetDashboardAsync(Guid tenantId);
}
