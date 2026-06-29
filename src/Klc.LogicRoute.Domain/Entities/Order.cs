using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public string? ErpReferenceId { get; set; }
    public Guid? ErpConnectionId { get; set; }
    public string? CustomerName { get; set; }
    public string? OriginAddress { get; set; }
    public string? OriginCity { get; set; }
    public double? OriginLat { get; set; }
    public double? OriginLng { get; set; }
    public string? DestinationAddress { get; set; }
    public string? DestinationCity { get; set; }
    public double? DestinationLat { get; set; }
    public double? DestinationLng { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal TotalVolumeM3 { get; set; }
    public int PalletCount { get; set; }
    public string? ProductCategory { get; set; }
    public bool IsHazardous { get; set; }
    public bool RequiresColdChain { get; set; }
    public decimal? TemperatureMin { get; set; }
    public decimal? TemperatureMax { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    public OrderPriority Priority { get; set; } = OrderPriority.Normal;
    public DateTime? RequestedDeliveryDate { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? Currency { get; set; } = "TRY";
    public string? Notes { get; set; }
    public string? BatchReference { get; set; }
    public Guid? ContractId { get; set; }
    public Guid? ProviderId { get; set; }

    public List<OrderLine> Lines { get; set; } = [];
}
