using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IDeliverySlotRepository
{
    Task<Guid> CreateAsync(DeliverySlot slot);
    Task<DeliverySlot?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<DeliverySlot>> GetAvailableAsync(Guid tenantId, DateOnly date, string? zipCode);
    Task UpdateStatusAsync(Guid id, Guid tenantId, DeliverySlotStatus status);
    Task ReserveAsync(Guid id, Guid tenantId, string customerName, string customerPhone, DateTime expiresAt);
    Task ConfirmAsync(Guid id, Guid tenantId);
}
