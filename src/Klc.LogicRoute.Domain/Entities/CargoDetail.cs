using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class CargoDetail : BaseEntity
{
    public Guid OrderId { get; set; }
    public decimal ActualWeightKg { get; set; }
    public decimal VolumetricWeightKg { get; set; }
    public decimal ChargeableWeightKg { get; set; }
    public decimal TotalVolumeM3 { get; set; }
    public int TotalPallets { get; set; }
    public decimal TotalDesi { get; set; }
    public VehicleCategory SuggestedVehicle { get; set; }
    public LoadType SuggestedLoadType { get; set; }
    public bool IsHazardous { get; set; }
    public bool RequiresColdChain { get; set; }
    public string? CalculationNotes { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
