namespace Klc.LogicRoute.Application.RouteOptimization.Models;

public class PlannedVsActualReport
{
    public Guid OptimizationId { get; set; }
    public string OptimizationName { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    // Planned totals
    public double PlannedTotalDistanceKm { get; set; }
    public double PlannedTotalDurationMinutes { get; set; }
    public int PlannedVehicleCount { get; set; }
    public int PlannedStopCount { get; set; }

    // Actual totals
    public double ActualTotalDistanceKm { get; set; }
    public double ActualTotalDurationMinutes { get; set; }
    public int ActualDeliveredCount { get; set; }

    // Variance
    public double DistanceVarianceKm { get; set; }
    public double DistanceVariancePercent { get; set; }
    public double DurationVarianceMinutes { get; set; }
    public double DurationVariancePercent { get; set; }

    // Delivery performance
    public double OnTimeDeliveryRate { get; set; }
    public double AverageDelayMinutes { get; set; }
    public double MaxDelayMinutes { get; set; }
    public int OnTimeCount { get; set; }
    public int LateCount { get; set; }
    public int NoDataCount { get; set; }

    // Per-route breakdown
    public List<RouteComparisonDetail> Routes { get; set; } = [];
}

public class RouteComparisonDetail
{
    public Guid RouteId { get; set; }
    public string? VehiclePlate { get; set; }

    public double PlannedDistanceKm { get; set; }
    public double PlannedDurationMinutes { get; set; }
    public double ActualDistanceKm { get; set; }
    public double ActualDurationMinutes { get; set; }

    public double DistanceVarianceKm { get; set; }
    public double DurationVarianceMinutes { get; set; }

    public List<StopComparisonDetail> Stops { get; set; } = [];
}

public class StopComparisonDetail
{
    public Guid StopId { get; set; }
    public Guid? ShipmentId { get; set; }
    public string? ShipmentNumber { get; set; }
    public int StopOrder { get; set; }
    public string? Address { get; set; }

    // Planned
    public DateTime? PlannedArrival { get; set; }
    public DateTime? PlannedDeparture { get; set; }

    // Actual
    public DateTime? ActualArrival { get; set; }
    public DateTime? ActualDelivery { get; set; }

    // Variance
    public double? DelayMinutes { get; set; }
    public string Status { get; set; } = "NoData"; // OnTime, Late, Early, NoData
}
