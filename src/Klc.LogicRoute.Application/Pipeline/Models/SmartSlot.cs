namespace Klc.LogicRoute.Application.Pipeline.Models;

public class SmartSlot
{
    public string TimeWindow { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal DiscountPercentage { get; set; }
    public double DetourMinutes { get; set; }
    public decimal CostImpact { get; set; }
    public int Rank { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsRecommended { get; set; }
}
