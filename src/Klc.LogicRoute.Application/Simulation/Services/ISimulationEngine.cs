using Klc.LogicRoute.Application.Simulation.Models;
using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Application.Simulation.Services;

public interface ISimulationEngine
{
    Task<DigitalTwinSnapshot> TakeSnapshotAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<SimulationResult> RunSimulationAsync(SimulationScenario scenario, Guid tenantId, CancellationToken cancellationToken = default);
}
