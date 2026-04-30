using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<Order>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<int> GetCountAsync(Guid tenantId);
    Task<Guid> InsertAsync(Order order);
    Task UpdateAsync(Order order);
    Task UpdateStatusAsync(Guid id, Guid tenantId, int status);
    Task DeleteAsync(Guid id, Guid tenantId);
    Task<IEnumerable<OrderLine>> GetLinesAsync(Guid orderId);
    Task InsertLineAsync(OrderLine line);
    Task DeleteLinesAsync(Guid orderId);
}
