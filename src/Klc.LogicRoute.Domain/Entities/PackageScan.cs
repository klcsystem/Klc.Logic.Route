using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class PackageScan : BaseEntity
{
    public Guid ShipmentId { get; set; }
    public Guid? OrderId { get; set; }
    public Guid DriverId { get; set; }
    public string BarcodeValue { get; set; } = string.Empty;
    public ScanType ScanType { get; set; }
    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;
    public double? Lat { get; set; }
    public double? Lng { get; set; }
}
