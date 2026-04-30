namespace Klc.LogicRoute.Domain.Enums;

public enum ShipmentStatus
{
    Draft = 0,
    Calculated = 1,
    PendingApproval = 2,
    Approved = 3,
    SentToProvider = 4,
    VehicleAssigned = 5,
    Loading = 6,
    InTransit = 7,
    Delivered = 8,
    Completed = 9,
    Cancelled = 10
}
