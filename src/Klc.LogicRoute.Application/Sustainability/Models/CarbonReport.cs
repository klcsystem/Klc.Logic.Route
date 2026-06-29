namespace Klc.LogicRoute.Application.Sustainability.Models;

public class CarbonReport
{
    public string Period { get; set; } = string.Empty;
    public int Year { get; set; }
    public int? Month { get; set; }
    public decimal TotalNaiveDistanceKm { get; set; }
    public decimal TotalOptimizedDistanceKm { get; set; }
    public decimal DistanceSavedKm { get; set; }
    public decimal TotalEmissionsKg { get; set; }
    public decimal EmissionsSavedKg { get; set; }
    public decimal CarbonCreditTons { get; set; }
    public decimal CarbonCreditValueEur { get; set; }
    public decimal MarketPricePerTon { get; set; } = 65m; // EU ETS
    public List<VehicleEmission> ByVehicleType { get; set; } = [];
    public int TotalRoutes { get; set; }
}

public class VehicleEmission
{
    public string VehicleType { get; set; } = string.Empty;
    public decimal EmissionFactorKgPerKm { get; set; }
    public decimal TotalDistanceKm { get; set; }
    public decimal TotalEmissionsKg { get; set; }
    public decimal EmissionsSavedKg { get; set; }
    public int RouteCount { get; set; }
}

public class EsgReport
{
    public int Year { get; set; }
    public decimal TotalEmissionsKg { get; set; }
    public decimal TotalSavingsKg { get; set; }
    public decimal SavingsPercent { get; set; }
    public decimal FleetEfficiencyScore { get; set; }
    public decimal CarbonCreditTons { get; set; }
    public decimal CarbonCreditValueEur { get; set; }
    public List<MonthlySummary> MonthlyBreakdown { get; set; } = [];
    public string Rating { get; set; } = string.Empty; // A, B, C, D, E
}

public class MonthlySummary
{
    public int Month { get; set; }
    public decimal EmissionsKg { get; set; }
    public decimal SavingsKg { get; set; }
    public int RouteCount { get; set; }
}

public class SavingsSummary
{
    public decimal TotalCO2SavedKg { get; set; }
    public decimal TotalCO2SavedTons { get; set; }
    public decimal CarbonCreditValueEur { get; set; }
    public decimal DistanceSavedKm { get; set; }
    public decimal FuelSavedLiters { get; set; }
    public decimal CostSavedTry { get; set; }
    public int OptimizedRouteCount { get; set; }
}
