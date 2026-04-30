using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IRecommendationRepository
{
    Task<IEnumerable<Recommendation>> GetByOrderIdAsync(Guid orderId, Guid tenantId);
    Task InsertAsync(Recommendation recommendation);
    Task DeleteByOrderIdAsync(Guid orderId, Guid tenantId);
    Task SelectAsync(Guid recommendationId, Guid tenantId);
}
