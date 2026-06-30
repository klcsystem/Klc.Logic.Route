using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IOptimizationPresetRepository
{
    Task<List<OptimizationPreset>> GetAllAsync(Guid tenantId);
    Task<OptimizationPreset?> GetByIdAsync(Guid id);
    Task<OptimizationPreset?> GetDefaultAsync(Guid tenantId);
    Task<Guid> InsertAsync(OptimizationPreset preset);
    Task UpdateAsync(OptimizationPreset preset);
    Task DeleteAsync(Guid id);
}
