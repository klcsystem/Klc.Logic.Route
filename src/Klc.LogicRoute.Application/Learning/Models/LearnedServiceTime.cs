namespace Klc.LogicRoute.Application.Learning.Models;

public class LearnedServiceTime
{
    public double LatRounded { get; set; }
    public double LngRounded { get; set; }
    public string? Address { get; set; }
    public string? CustomerName { get; set; }
    public double AverageMinutes { get; set; }
    public double MedianMinutes { get; set; }
    public double P90Minutes { get; set; }
    public int SampleCount { get; set; }
    public DateTime LastUpdated { get; set; }

    /// <summary>
    /// Breakdown by time-of-day bucket: Morning, Midday, Afternoon, Evening
    /// </summary>
    public Dictionary<string, double> ByTimeOfDay { get; set; } = new();

    /// <summary>
    /// Breakdown by day-of-week (0=Sunday .. 6=Saturday)
    /// </summary>
    public Dictionary<int, double> ByDayOfWeek { get; set; } = new();
}

public class LearnedAddress
{
    public string Key { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? OriginalAddress { get; set; }
    public double OriginalLat { get; set; }
    public double OriginalLng { get; set; }
    public double LearnedLat { get; set; }
    public double LearnedLng { get; set; }
    public double DeviationMeters { get; set; }
    public int SampleCount { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class LearnedTrafficPattern
{
    public int DayOfWeek { get; set; }
    public string DayName { get; set; } = string.Empty;
    public int Hour { get; set; }
    public string? RegionPair { get; set; }
    public double Multiplier { get; set; }
    public double HardcodedMultiplier { get; set; }
    public int SampleCount { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class LearningSummary
{
    public int TotalServiceTimeLearned { get; set; }
    public int TotalAddressCorrected { get; set; }
    public int TotalTrafficPatterns { get; set; }
    public int TotalDataPointsProcessed { get; set; }
    public double AverageServiceTimeAccuracyImprovement { get; set; }
    public double AverageEtaAccuracyImprovement { get; set; }
    public DateTime? LastTrainingRun { get; set; }
    public DateTime? NextScheduledRun { get; set; }
}

public class ServiceTimeObservation
{
    public Guid StopId { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string? Address { get; set; }
    public string? CustomerName { get; set; }
    public DateTime ArrivalTime { get; set; }
    public DateTime DepartureTime { get; set; }
    public double ServiceTimeMinutes { get; set; }
    public int Hour { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
}
