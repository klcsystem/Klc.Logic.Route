using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class VehicleProfile : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal MaxWeightKg { get; set; }
    public decimal MaxVolumeM3 { get; set; }
    public double MaxHeightM { get; set; }
    public double MaxWidthM { get; set; }
    public double MaxLengthM { get; set; }
    public bool IsHazmat { get; set; }
    public bool IsFrigorifik { get; set; }
    public bool AvoidTolls { get; set; }
    public bool AvoidFerries { get; set; }
    public decimal CostPerKm { get; set; }
    public bool IsDefault { get; set; }
}
