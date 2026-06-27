namespace Klc.LogicRoute.Application.TerritoryPlanning.Models;

/// <summary>
/// A delivery point with geographic coordinates and cargo metrics.
/// </summary>
public class DeliveryPoint
{
    public Guid? OrderId { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double WeightKg { get; set; }
    public double VolumeM3 { get; set; }
    public string? Address { get; set; }
}

/// <summary>
/// Request model for territory planning.
/// </summary>
public class TerritoryPlanRequest
{
    /// <summary>Optional list of order IDs to fetch coordinates from DB.</summary>
    public List<Guid>? OrderIds { get; set; }

    /// <summary>Direct coordinate input (used when OrderIds is null/empty).</summary>
    public List<DeliveryPoint>? Points { get; set; }

    /// <summary>Number of zones to create. If null, equals available vehicle count.</summary>
    public int? ZoneCount { get; set; }

    /// <summary>Max iterations for K-means convergence.</summary>
    public int MaxIterations { get; set; } = 100;

    /// <summary>Enable workload balancing post-processing.</summary>
    public bool BalanceWorkload { get; set; } = true;

    /// <summary>Weight factor for balancing (0 = distance only, 1 = workload only).</summary>
    public double BalanceWeight { get; set; } = 0.3;
}

/// <summary>
/// A territory/zone produced by clustering.
/// </summary>
public class Territory
{
    public int ZoneId { get; set; }
    public string Name { get; set; } = string.Empty;
    public double CentroidLat { get; set; }
    public double CentroidLng { get; set; }
    public string Color { get; set; } = string.Empty;
    public List<DeliveryPoint> Stops { get; set; } = new();
    public double TotalWeightKg { get; set; }
    public double TotalVolumeM3 { get; set; }
    public int StopCount { get; set; }
    public Guid? SuggestedVehicleId { get; set; }
    public string? SuggestedVehiclePlate { get; set; }
}

/// <summary>
/// Result of territory planning.
/// </summary>
public class TerritoryPlanResult
{
    public List<Territory> Zones { get; set; } = new();
    public int TotalStops { get; set; }
    public double TotalWeightKg { get; set; }
    public double TotalVolumeM3 { get; set; }
    public int Iterations { get; set; }
    public bool Converged { get; set; }
    public long ComputeTimeMs { get; set; }

    /// <summary>Statistics per zone for frontend display.</summary>
    public List<ZoneStatistics> Statistics { get; set; } = new();
}

/// <summary>
/// Per-zone statistics.
/// </summary>
public class ZoneStatistics
{
    public int ZoneId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int StopCount { get; set; }
    public double TotalWeightKg { get; set; }
    public double TotalVolumeM3 { get; set; }
    public double AvgDistanceFromCentroidKm { get; set; }
    public double MaxDistanceFromCentroidKm { get; set; }
    public double WorkloadPercent { get; set; }
}
