using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IDeliveryFeedbackRepository
{
    Task InsertAsync(DeliveryFeedback feedback);
    Task<IEnumerable<DeliveryFeedback>> GetAllAsync(Guid tenantId, int limit = 100, int offset = 0);
    Task<DeliveryFeedback?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<DeliveryFeedback>> GetByShipmentIdAsync(Guid shipmentId, Guid tenantId);
    Task<IEnumerable<DeliveryFeedback>> GetByDriverIdAsync(Guid driverId, Guid tenantId);
    Task<FeedbackSummary> GetSummaryAsync(Guid tenantId);
}

public record FeedbackSummary(
    double AverageRating,
    int TotalCount,
    int Rating1Count,
    int Rating2Count,
    int Rating3Count,
    int Rating4Count,
    int Rating5Count);
