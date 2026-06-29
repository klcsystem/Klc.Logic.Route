using Klc.LogicRoute.Application.Pipeline.Models;
using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Application.Pipeline;

public interface IAutoBatchService
{
    /// <summary>
    /// Groups a list of pending orders into batches suitable for route optimization.
    /// Orders are grouped by region, delivery date, and special requirements compatibility.
    /// Each batch respects the maximum vehicle weight capacity.
    /// </summary>
    List<OrderBatch> GroupIntoBatches(
        IEnumerable<Order> pendingOrders,
        Guid tenantId,
        decimal maxVehicleCapacityKg = 8000m);
}
