using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class DriverLocation : BaseEntity
{
    public Guid DriverId { get; set; }
    public Guid? ShipmentId { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double? Speed { get; set; }
    public double? Heading { get; set; }
    public double? Accuracy { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}
