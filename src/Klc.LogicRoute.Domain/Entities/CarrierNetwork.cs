using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class CarrierNetwork : BaseEntity
{
    public string CarrierName { get; set; } = string.Empty;
    public string? ApiEndpoint { get; set; }
    public string? ApiKey { get; set; }
    public string? SupportedRegions { get; set; } // JSON array
    public string? VehicleTypes { get; set; } // JSON array
    public CarrierPricingModel PricingModel { get; set; } = CarrierPricingModel.PerKm;
    public bool IsActive { get; set; } = true;
}

public enum CarrierPricingModel
{
    PerKg = 0,
    PerKm = 1,
    Flat = 2
}
