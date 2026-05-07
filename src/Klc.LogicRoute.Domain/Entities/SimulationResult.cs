using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class SimulationResult : BaseEntity
{
    public Guid ScenarioId { get; set; }
    public decimal TotalCost { get; set; }
    public double TotalDistanceKm { get; set; }
    public double TotalDurationHours { get; set; }
    public double VehicleUtilizationPct { get; set; }
    public double OnTimePredictionPct { get; set; }
    public double Co2TotalKg { get; set; }
    public int UnservedShipments { get; set; }
    public double CostDeltaPct { get; set; }
    public string? Details { get; set; } // JSON
}
