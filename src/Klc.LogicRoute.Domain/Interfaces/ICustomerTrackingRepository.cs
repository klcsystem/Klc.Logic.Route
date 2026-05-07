using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface ICustomerTrackingRepository
{
    Task<CustomerTracking?> GetByTokenAsync(string token);
    Task<CustomerTracking?> GetByShipmentIdAsync(Guid shipmentId, Guid tenantId);
    Task<Guid> CreateAsync(CustomerTracking tracking);
    Task UpdateEtaAsync(Guid id, DateTime estimatedArrival);
}
