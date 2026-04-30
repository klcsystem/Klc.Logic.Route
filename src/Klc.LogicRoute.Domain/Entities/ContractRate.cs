using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class ContractRate : BaseEntity
{
    public Guid ContractId { get; set; }
    public string? OriginRegion { get; set; }
    public string? DestinationRegion { get; set; }
    public VehicleCategory VehicleCategory { get; set; }
    public decimal MinWeightKg { get; set; }
    public decimal MaxWeightKg { get; set; }
    public decimal? MinDistanceKm { get; set; }
    public decimal? MaxDistanceKm { get; set; }
    public decimal PricePerUnit { get; set; }
    public PricingUnit PricingUnit { get; set; }
    public string? Currency { get; set; } = "TRY";
    public decimal? UrgentSurchargePercent { get; set; }
    public decimal? AdrSurchargePercent { get; set; }
    public decimal? FrigoSurchargePercent { get; set; }
    public decimal? WeekendSurchargePercent { get; set; }
    public bool IsActive { get; set; } = true;
}
