using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IProofOfDeliveryRepository
{
    Task<Guid> CreateAsync(ProofOfDelivery pod);
    Task<ProofOfDelivery?> GetByShipmentIdAsync(Guid shipmentId, Guid tenantId);
}
