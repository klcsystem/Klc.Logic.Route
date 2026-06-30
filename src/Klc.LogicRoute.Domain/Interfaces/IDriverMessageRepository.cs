using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IDriverMessageRepository
{
    Task<Guid> CreateAsync(DriverMessage message);
    Task<IEnumerable<DriverMessage>> GetByShipmentIdAsync(Guid shipmentId, Guid tenantId);
    Task MarkAsReadAsync(Guid messageId, Guid tenantId);
}
