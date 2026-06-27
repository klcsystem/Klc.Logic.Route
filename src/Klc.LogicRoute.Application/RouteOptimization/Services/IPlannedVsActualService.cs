using Klc.LogicRoute.Application.RouteOptimization.Models;

namespace Klc.LogicRoute.Application.RouteOptimization.Services;

public interface IPlannedVsActualService
{
    Task<PlannedVsActualReport?> GenerateReportAsync(Guid optimizationId, Guid tenantId);
}
