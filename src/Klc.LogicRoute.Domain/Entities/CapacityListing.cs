using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class CapacityListing : BaseEntity
{
    public string OriginCity { get; set; } = string.Empty;
    public string DestinationCity { get; set; } = string.Empty;
    public DateTime AvailableDate { get; set; }
    public decimal AvailableWeightKg { get; set; }
    public decimal AvailableVolumeM3 { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public decimal PricePerKg { get; set; }
    public CapacityListingStatus Status { get; set; } = CapacityListingStatus.Available;
    public string? ContactPhone { get; set; }
    public string? Notes { get; set; }
}

public enum CapacityListingStatus
{
    Available = 0,
    Matched = 1,
    Expired = 2,
    Cancelled = 3
}
