using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IMLModelRepository
{
    Task<MLModelMetadata?> GetActiveModelAsync(string modelType, Guid tenantId);
    Task<IEnumerable<MLModelMetadata>> GetAllAsync(Guid tenantId);
    Task<Guid> CreateAsync(MLModelMetadata model);
    Task UpdateAsync(MLModelMetadata model);
    Task DeactivateAllAsync(string modelType, Guid tenantId);
}

public interface IPredictionLogRepository
{
    Task<Guid> CreateAsync(PredictionLog log);
    Task<IEnumerable<PredictionLog>> GetByModelTypeAsync(string modelType, Guid tenantId, int limit = 100);
}
