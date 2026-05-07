using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface ISimulationRepository
{
    Task<SimulationScenario?> GetScenarioByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<SimulationScenario>> GetAllScenariosAsync(Guid tenantId);
    Task<Guid> CreateScenarioAsync(SimulationScenario scenario);
    Task UpdateScenarioAsync(SimulationScenario scenario);
    Task<SimulationResult?> GetResultByScenarioIdAsync(Guid scenarioId, Guid tenantId);
    Task<Guid> CreateResultAsync(SimulationResult result);
}
