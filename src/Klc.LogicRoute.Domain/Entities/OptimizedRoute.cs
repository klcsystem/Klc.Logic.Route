using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class OptimizedRoute : BaseEntity
{
    public Guid OptimizationId { get; set; }
    public Guid? VehicleId { get; set; }
    public string? VehiclePlate { get; set; }
    public int SequenceOrder { get; set; }
    public double TotalDistanceKm { get; set; }
    public double TotalDurationMinutes { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal TotalVolumeM3 { get; set; }

    public List<RouteStop> Stops { get; set; } = [];
}
