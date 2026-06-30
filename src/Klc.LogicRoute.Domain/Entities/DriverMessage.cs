using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class DriverMessage : BaseEntity
{
    public Guid ShipmentId { get; set; }
    public Guid SenderId { get; set; }
    public SenderType SenderType { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime? ReadAt { get; set; }
}

public enum SenderType
{
    Driver = 0,
    Operations = 1,
    Customer = 2
}
