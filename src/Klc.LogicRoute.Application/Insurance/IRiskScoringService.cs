namespace Klc.LogicRoute.Application.Insurance;

public interface IRiskScoringService
{
    RiskAssessment CalculateRisk(RiskInput input);
}

public class RiskInput
{
    public decimal CargoValue { get; set; }
    public decimal RouteDistanceKm { get; set; }
    public decimal DriverScore { get; set; } // 0-100
    public int VehicleAgeYears { get; set; }
    public bool IsHazardous { get; set; }
    public bool RequiresColdChain { get; set; }
    public decimal? HistoricalDamageRate { get; set; } // 0-1
}

public class RiskAssessment
{
    public decimal RiskScore { get; set; } // 0-100
    public string RiskLevel { get; set; } = string.Empty; // Low, Medium, High, Critical
    public decimal SuggestedPremiumMin { get; set; }
    public decimal SuggestedPremiumMax { get; set; }
    public List<string> RiskFactors { get; set; } = [];
}
