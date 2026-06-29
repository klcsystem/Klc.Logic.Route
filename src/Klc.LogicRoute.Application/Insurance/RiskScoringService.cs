namespace Klc.LogicRoute.Application.Insurance;

public class RiskScoringService : IRiskScoringService
{
    public RiskAssessment CalculateRisk(RiskInput input)
    {
        var factors = new List<string>();
        decimal score = 0;

        // Cargo value factor (0-25 points)
        var valueFactor = input.CargoValue switch
        {
            > 1_000_000m => 25m,
            > 500_000m => 20m,
            > 100_000m => 15m,
            > 50_000m => 10m,
            _ => 5m
        };
        score += valueFactor;
        if (valueFactor >= 20) factors.Add($"Yuksek kargo degeri: {input.CargoValue:N0} TRY");

        // Route distance factor (0-15 points)
        var distanceFactor = input.RouteDistanceKm switch
        {
            > 1500m => 15m,
            > 1000m => 12m,
            > 500m => 8m,
            > 200m => 5m,
            _ => 2m
        };
        score += distanceFactor;
        if (distanceFactor >= 12) factors.Add($"Uzun mesafe: {input.RouteDistanceKm:N0} km");

        // Driver score factor (0-20 points, inversely proportional)
        var driverFactor = input.DriverScore switch
        {
            >= 90m => 2m,
            >= 75m => 5m,
            >= 60m => 10m,
            >= 40m => 15m,
            _ => 20m
        };
        score += driverFactor;
        if (driverFactor >= 15) factors.Add($"Dusuk surucu puani: {input.DriverScore}");

        // Vehicle age factor (0-15 points)
        var ageFactor = input.VehicleAgeYears switch
        {
            > 15 => 15m,
            > 10 => 12m,
            > 7 => 8m,
            > 3 => 4m,
            _ => 1m
        };
        score += ageFactor;
        if (ageFactor >= 12) factors.Add($"Eski arac: {input.VehicleAgeYears} yil");

        // Hazardous cargo (0-15 points)
        if (input.IsHazardous)
        {
            score += 15;
            factors.Add("Tehlikeli madde tasiyor");
        }

        // Cold chain (0-5 points)
        if (input.RequiresColdChain)
        {
            score += 5;
            factors.Add("Soguk zincir gerekli");
        }

        // Historical damage rate (0-5 points)
        if (input.HistoricalDamageRate.HasValue)
        {
            var damageFactor = input.HistoricalDamageRate.Value * 5m;
            score += Math.Min(5m, damageFactor);
            if (input.HistoricalDamageRate.Value > 0.1m)
                factors.Add($"Gecmis hasar orani: %{input.HistoricalDamageRate.Value * 100:N1}");
        }

        score = Math.Min(100, Math.Round(score, 1));

        // Premium calculation based on risk score and cargo value
        var premiumRate = score switch
        {
            >= 80 => (0.025m, 0.05m),   // 2.5%-5% of cargo value
            >= 60 => (0.015m, 0.03m),   // 1.5%-3%
            >= 40 => (0.008m, 0.018m),  // 0.8%-1.8%
            >= 20 => (0.004m, 0.01m),   // 0.4%-1%
            _ => (0.002m, 0.005m)        // 0.2%-0.5%
        };

        var riskLevel = score switch
        {
            >= 75 => "Critical",
            >= 50 => "High",
            >= 25 => "Medium",
            _ => "Low"
        };

        return new RiskAssessment
        {
            RiskScore = score,
            RiskLevel = riskLevel,
            SuggestedPremiumMin = Math.Round(input.CargoValue * premiumRate.Item1, 2),
            SuggestedPremiumMax = Math.Round(input.CargoValue * premiumRate.Item2, 2),
            RiskFactors = factors
        };
    }
}
