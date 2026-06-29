using Klc.LogicRoute.Application.Sustainability.Models;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.Sustainability;

public class CarbonCreditService(IRouteOptimizationRepository routeRepository) : ICarbonCreditService
{
    // Emission factors by vehicle type (kg CO2 per km)
    private static readonly Dictionary<string, decimal> EmissionFactorsKgPerKm = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Tir"] = 0.9m,
        ["Kamyon"] = 0.6m,
        ["Kamyonet"] = 0.3m,
        ["Frigorifik"] = 0.75m,
        ["Parsiyel"] = 0.45m,
        ["Tanker"] = 0.85m,
        ["LowBed"] = 0.95m,
        ["Konteyner"] = 0.7m
    };

    private const decimal EuEtsPricePerTon = 65m;
    private const decimal AvgFuelConsumptionLPerKm = 0.35m;
    private const decimal AvgFuelPriceTry = 45m;

    public async Task<CarbonReport> GetCarbonReportAsync(Guid tenantId, string period, int year, int? month)
    {
        var optimizations = await routeRepository.GetAllAsync(tenantId, 1, 10000);
        var filtered = optimizations.Where(r =>
        {
            if (r.CreatedAt.Year != year) return false;
            if (period.Equals("monthly", StringComparison.OrdinalIgnoreCase) && month.HasValue)
                return r.CreatedAt.Month == month.Value;
            return true;
        }).ToList();

        var report = new CarbonReport
        {
            Period = period,
            Year = year,
            Month = month,
            TotalRoutes = filtered.Count
        };

        var vehicleGroups = new Dictionary<string, VehicleEmission>(StringComparer.OrdinalIgnoreCase);

        foreach (var opt in filtered)
        {
            var optimizedDistance = (decimal)opt.TotalDistanceKm;
            var naiveDistance = optimizedDistance * 1.3m; // Assume naive route is 30% longer
            var vehicleType = "Kamyon"; // Default — OptimizedRoute has no VehicleType field
            var emissionFactor = EmissionFactorsKgPerKm.GetValueOrDefault(vehicleType, 0.6m);

            var emissions = optimizedDistance * emissionFactor;
            var naiveEmissions = naiveDistance * emissionFactor;
            var saved = naiveEmissions - emissions;

            report.TotalNaiveDistanceKm += naiveDistance;
            report.TotalOptimizedDistanceKm += optimizedDistance;
            report.DistanceSavedKm += naiveDistance - optimizedDistance;
            report.TotalEmissionsKg += emissions;
            report.EmissionsSavedKg += saved;

            if (!vehicleGroups.ContainsKey(vehicleType))
                vehicleGroups[vehicleType] = new VehicleEmission
                {
                    VehicleType = vehicleType,
                    EmissionFactorKgPerKm = emissionFactor
                };

            vehicleGroups[vehicleType].TotalDistanceKm += optimizedDistance;
            vehicleGroups[vehicleType].TotalEmissionsKg += emissions;
            vehicleGroups[vehicleType].EmissionsSavedKg += saved;
            vehicleGroups[vehicleType].RouteCount++;
        }

        report.CarbonCreditTons = Math.Round(report.EmissionsSavedKg / 1000m, 2);
        report.CarbonCreditValueEur = Math.Round(report.CarbonCreditTons * EuEtsPricePerTon, 2);
        report.ByVehicleType = vehicleGroups.Values.ToList();

        return report;
    }

    public async Task<EsgReport> GetEsgReportAsync(Guid tenantId, int year)
    {
        var report = new EsgReport { Year = year };
        var monthlyData = new List<MonthlySummary>();

        for (var m = 1; m <= 12; m++)
        {
            var carbonReport = await GetCarbonReportAsync(tenantId, "monthly", year, m);
            monthlyData.Add(new MonthlySummary
            {
                Month = m,
                EmissionsKg = carbonReport.TotalEmissionsKg,
                SavingsKg = carbonReport.EmissionsSavedKg,
                RouteCount = carbonReport.TotalRoutes
            });

            report.TotalEmissionsKg += carbonReport.TotalEmissionsKg;
            report.TotalSavingsKg += carbonReport.EmissionsSavedKg;
        }

        report.MonthlyBreakdown = monthlyData;
        report.CarbonCreditTons = Math.Round(report.TotalSavingsKg / 1000m, 2);
        report.CarbonCreditValueEur = Math.Round(report.CarbonCreditTons * EuEtsPricePerTon, 2);

        var totalPossible = report.TotalEmissionsKg + report.TotalSavingsKg;
        report.SavingsPercent = totalPossible > 0
            ? Math.Round(report.TotalSavingsKg / totalPossible * 100m, 1)
            : 0;

        // Fleet efficiency score: 0-100
        report.FleetEfficiencyScore = Math.Min(100, Math.Round(report.SavingsPercent * 4, 1));

        // ESG Rating based on efficiency score
        report.Rating = report.FleetEfficiencyScore switch
        {
            >= 80 => "A",
            >= 60 => "B",
            >= 40 => "C",
            >= 20 => "D",
            _ => "E"
        };

        return report;
    }

    public async Task<SavingsSummary> GetSavingsSummaryAsync(Guid tenantId)
    {
        var currentYear = DateTime.UtcNow.Year;
        var carbonReport = await GetCarbonReportAsync(tenantId, "yearly", currentYear, null);

        return new SavingsSummary
        {
            TotalCO2SavedKg = Math.Round(carbonReport.EmissionsSavedKg, 2),
            TotalCO2SavedTons = Math.Round(carbonReport.EmissionsSavedKg / 1000m, 2),
            CarbonCreditValueEur = carbonReport.CarbonCreditValueEur,
            DistanceSavedKm = Math.Round(carbonReport.DistanceSavedKm, 1),
            FuelSavedLiters = Math.Round(carbonReport.DistanceSavedKm * AvgFuelConsumptionLPerKm, 1),
            CostSavedTry = Math.Round(carbonReport.DistanceSavedKm * AvgFuelConsumptionLPerKm * AvgFuelPriceTry, 2),
            OptimizedRouteCount = carbonReport.TotalRoutes
        };
    }
}
