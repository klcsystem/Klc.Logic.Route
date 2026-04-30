using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class Shipment : BaseEntity
{
    public string ShipmentNumber { get; set; } = string.Empty;
    public Guid? OrderId { get; set; }
    public string? OriginAddress { get; set; }
    public string? OriginCity { get; set; }
    public string? DestinationAddress { get; set; }
    public string? DestinationCity { get; set; }
    public ShipmentStatus Status { get; set; } = ShipmentStatus.Draft;
    public ShipmentPriority Priority { get; set; } = ShipmentPriority.Normal;
    public DateTime? RequestedPickupDate { get; set; }
    public DateTime? RequestedDeliveryDate { get; set; }
    public DateTime? ActualPickupDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }

    // Kargo Hesaplama
    public decimal TotalWeightKg { get; set; }
    public decimal TotalVolumeM3 { get; set; }
    public decimal TotalDesiWeight { get; set; }
    public decimal ChargeableWeight { get; set; }
    public int PalletCount { get; set; }
    public bool IsHazardous { get; set; }
    public bool RequiresColdChain { get; set; }
    public decimal? TemperatureMin { get; set; }
    public decimal? TemperatureMax { get; set; }
    public bool IsStackable { get; set; } = true;

    // Karar Motoru Sonucu
    public Guid? SelectedProviderId { get; set; }
    public Guid? SelectedContractRateId { get; set; }
    public VehicleCategory RecommendedVehicle { get; set; }
    public decimal? CalculatedPrice { get; set; }
    public string? Currency { get; set; } = "TRY";
    public string? ProviderReferenceId { get; set; }

    // Takip
    public decimal? CurrentLatitude { get; set; }
    public decimal? CurrentLongitude { get; set; }
    public DateTime? LastTrackingUpdate { get; set; }
    public string? EstimatedArrival { get; set; }

    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? VehiclePlate { get; set; }
    public string? Notes { get; set; }

    public List<ShipmentItem> Items { get; set; } = [];
    public Recommendation? Recommendation { get; set; }
}
