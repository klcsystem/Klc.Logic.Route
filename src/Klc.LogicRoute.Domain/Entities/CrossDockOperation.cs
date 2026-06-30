using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class CrossDockOperation : BaseEntity
{
    public string HubName { get; set; } = string.Empty;
    public double HubLat { get; set; }
    public double HubLng { get; set; }
    public Guid InboundVehicleId { get; set; }
    public Guid OutboundVehicleId { get; set; }
    public DateTime TransferDate { get; set; }
    public CrossDockStatus Status { get; set; } = CrossDockStatus.Planned;
    public string? Items { get; set; } // JSON array of shipment IDs
    public string? Notes { get; set; }
}

public enum CrossDockStatus
{
    Planned = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3
}
