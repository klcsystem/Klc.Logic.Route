using Klc.LogicRoute.Application.Pipeline.Models;

namespace Klc.LogicRoute.Application.Pipeline;

public interface ISmartSlotService
{
    /// <summary>
    /// Suggests optimal delivery time slots based on existing routes for a given order and date.
    /// Minimizes route disruption by checking existing optimized routes in the same region.
    /// </summary>
    Task<List<SmartSlot>> SuggestSlotsAsync(Guid orderId, DateOnly date, Guid tenantId);
}
