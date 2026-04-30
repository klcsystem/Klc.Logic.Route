using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IShipmentRepository
{
    Task<Shipment?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<Shipment>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<int> GetCountAsync(Guid tenantId);
    Task<Guid> InsertAsync(Shipment shipment);
    Task UpdateAsync(Shipment shipment);
    Task UpdateStatusAsync(Guid id, Guid tenantId, int status);
    Task DeleteAsync(Guid id, Guid tenantId);
    Task<IEnumerable<ShipmentItem>> GetItemsAsync(Guid shipmentId);
    Task InsertItemAsync(ShipmentItem item);
    Task DeleteItemsAsync(Guid shipmentId);
}
