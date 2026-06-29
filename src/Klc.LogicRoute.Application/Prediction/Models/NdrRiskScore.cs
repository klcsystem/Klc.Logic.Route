namespace Klc.LogicRoute.Application.Prediction.Models;

public class NdrRiskScore
{
    public Guid OrderId { get; set; }
    public int Score { get; set; }
    public NdrRiskLevel RiskLevel { get; set; }
    public List<string> Factors { get; set; } = [];
    public List<string> Recommendations { get; set; } = [];
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

public enum NdrRiskLevel
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public class NdrBatchRequest
{
    public List<Guid> OrderIds { get; set; } = [];
}

public class NdrBatchResult
{
    public List<NdrRiskScore> Results { get; set; } = [];
    public int TotalOrders { get; set; }
    public int HighRiskCount { get; set; }
    public int CriticalRiskCount { get; set; }
    public double AverageScore { get; set; }
}
