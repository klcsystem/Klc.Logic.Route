using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class OptimizationPreset : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int MaxStopsPerRoute { get; set; }
    public decimal MaxDistanceKm { get; set; }
    public int MaxDurationMinutes { get; set; }
    public int BreakDurationMinutes { get; set; }
    public int BreakAfterMinutes { get; set; }
    public bool AllowOvernight { get; set; }
    public bool BalanceWorkload { get; set; }
    public RouteEndMode RouteEndMode { get; set; } = RouteEndMode.ReturnToDepot;
    public string? EndAddress { get; set; }
    public double? EndLat { get; set; }
    public double? EndLng { get; set; }
    public bool IsDefault { get; set; }
}
