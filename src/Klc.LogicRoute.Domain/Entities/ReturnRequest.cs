using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class ReturnRequest : BaseEntity
{
    public Guid? OriginalShipmentId { get; set; }
    public Guid? OrderId { get; set; }
    public ReturnReason Reason { get; set; } = ReturnReason.Other;
    public ReturnStatus Status { get; set; } = ReturnStatus.Requested;
    public string? PickupAddress { get; set; }
    public double PickupLat { get; set; }
    public double PickupLng { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PickupDate { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public string? Notes { get; set; }
}
