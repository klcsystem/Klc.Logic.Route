using Klc.LogicRoute.Application.RouteOptimization.Models;

namespace Klc.LogicRoute.Application.RouteOptimization.Services;

public interface IVrpSolverService
{
    Task<VrpResult> SolveAsync(VrpRequest request, CancellationToken cancellationToken = default);
}
