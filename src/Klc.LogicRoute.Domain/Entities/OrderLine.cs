using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class OrderLine : BaseEntity
{
    public Guid OrderId { get; set; }
    public int LineNumber { get; set; }
    public string? ProductCode { get; set; }
    public string? ProductName { get; set; }
    public decimal Quantity { get; set; }
    public string? Unit { get; set; }
    public decimal WeightKg { get; set; }
    public decimal VolumeM3 { get; set; }
    public decimal WidthCm { get; set; }
    public decimal HeightCm { get; set; }
    public decimal DepthCm { get; set; }
    public decimal DesiWeight { get; set; }
    public bool IsStackable { get; set; } = true;
    public string? Notes { get; set; }
}
