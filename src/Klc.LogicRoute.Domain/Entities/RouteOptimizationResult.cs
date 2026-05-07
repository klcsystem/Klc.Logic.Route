using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class RouteOptimizationResult : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Solving, Completed, Failed
    public double TotalDistanceKm { get; set; }
    public double TotalDurationMinutes { get; set; }
    public decimal TotalCost { get; set; }
    public int VehicleCount { get; set; }
    public int StopCount { get; set; }
    public string SolverType { get; set; } = "NearestNeighbor";
    public long SolveTimeMs { get; set; }

    public List<OptimizedRoute> Routes { get; set; } = [];
}
