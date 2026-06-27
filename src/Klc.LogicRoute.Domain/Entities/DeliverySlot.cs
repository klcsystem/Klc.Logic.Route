using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class DeliverySlot : BaseEntity
{
    public Guid? OrderId { get; set; }
    public Guid? ShipmentId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? ZipCode { get; set; }
    public DeliverySlotStatus Status { get; set; } = DeliverySlotStatus.Available;
    public DateTime? ReservedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
