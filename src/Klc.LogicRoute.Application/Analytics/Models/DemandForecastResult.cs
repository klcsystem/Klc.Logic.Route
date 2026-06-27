namespace Klc.LogicRoute.Application.Analytics.Models;

public class DemandForecastResult
{
    public List<DailyPrediction> DailyPredictions { get; set; } = [];
    public DayOfWeek BusiestDay { get; set; }
    public int RecommendedVehicleCount { get; set; }
    public double AverageOrdersPerDay { get; set; }
    public double TrendPercent { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class DailyPrediction
{
    public DateTime Date { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public int PredictedOrderCount { get; set; }
    public double ConfidenceLow { get; set; }
    public double ConfidenceHigh { get; set; }
    public double SeasonalFactor { get; set; }
}

public class RegionDemand
{
    public string City { get; set; } = string.Empty;
    public int OrderCount { get; set; }
    public decimal TotalWeightKg { get; set; }
    public decimal TotalVolumeM3 { get; set; }
    public double AverageOrdersPerDay { get; set; }
    public double GrowthPercent { get; set; }
}
