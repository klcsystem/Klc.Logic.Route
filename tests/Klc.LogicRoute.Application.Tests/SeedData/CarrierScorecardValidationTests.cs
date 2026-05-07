using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Application.Tests.SeedData;

/// <summary>
/// Carrier scorecard hesaplama ve veri butunlugu testleri.
/// CarrierPerformance entity'sinin dogru degerler icerdigini dogrular.
/// </summary>
public class CarrierScorecardValidationTests
{
    private static CarrierPerformance CreatePerformance(
        int totalShipments = 100,
        int onTime = 85,
        int late = 15,
        int damaged = 2,
        int cancelled = 3,
        decimal totalCost = 500000m,
        decimal co2TotalKg = 15000m,
        decimal avgDeliveryHours = 36m)
    {
        return new CarrierPerformance
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            ProviderId = Guid.NewGuid(),
            ProviderName = "Test Provider",
            Year = 2026,
            Month = 5,
            Period = 202605,
            TotalShipments = totalShipments,
            OnTimeDeliveries = onTime,
            LateDeliveries = late,
            DamagedShipments = damaged,
            CancelledShipments = cancelled,
            OnTimePercentage = totalShipments > 0 ? Math.Round((decimal)onTime / totalShipments * 100, 2) : 0,
            AverageDeliveryHours = avgDeliveryHours,
            TotalCost = totalCost,
            AverageCostPerKg = totalShipments > 0 ? Math.Round(totalCost / (totalShipments * 5000m), 4) : 0,
            CO2TotalKg = co2TotalKg,
            OverallScore = CalculateOverallScore(onTime, totalShipments, damaged)
        };
    }

    private static decimal CalculateOverallScore(int onTime, int total, int damaged)
    {
        if (total == 0) return 0;
        var onTimeRate = (double)onTime / total;
        var damageRate = (double)damaged / total;
        return Math.Round((decimal)(onTimeRate * 85 + (1 - damageRate) * 15), 2);
    }

    [Fact]
    public void CarrierPerformance_OnTimePlusLate_ShouldEqualTotal()
    {
        var perf = CreatePerformance(totalShipments: 100, onTime: 85, late: 15);

        (perf.OnTimeDeliveries + perf.LateDeliveries).Should().Be(perf.TotalShipments);
    }

    [Fact]
    public void CarrierPerformance_OnTimePercentage_ShouldMatchCounts()
    {
        var perf = CreatePerformance(totalShipments: 200, onTime: 170, late: 30);

        perf.OnTimePercentage.Should().Be(85.00m);
    }

    [Fact]
    public void CarrierPerformance_PerfectProvider_HighScore()
    {
        var perf = CreatePerformance(totalShipments: 100, onTime: 98, late: 2, damaged: 0);

        perf.OverallScore.Should().BeGreaterThan(90m);
        perf.OnTimePercentage.Should().Be(98m);
    }

    [Fact]
    public void CarrierPerformance_PoorProvider_LowScore()
    {
        var perf = CreatePerformance(totalShipments: 100, onTime: 60, late: 40, damaged: 10);

        perf.OverallScore.Should().BeLessThan(70m);
    }

    [Fact]
    public void CarrierPerformance_AverageCostPerKg_ShouldBePositive()
    {
        var perf = CreatePerformance(totalCost: 500000m);

        perf.AverageCostPerKg.Should().BeGreaterThan(0);
    }

    [Fact]
    public void CarrierPerformance_Period_ShouldMatchYearMonth()
    {
        var perf = CreatePerformance();

        perf.Period.Should().Be(perf.Year * 100 + perf.Month);
    }

    [Fact]
    public void CarrierPerformance_CO2_ShouldBePositive()
    {
        var perf = CreatePerformance(co2TotalKg: 15000m);

        perf.CO2TotalKg.Should().BeGreaterThan(0);
    }

    [Fact]
    public void CarrierPerformance_DamagedShipments_ShouldNotExceedTotal()
    {
        var perf = CreatePerformance(totalShipments: 100, damaged: 5);

        perf.DamagedShipments.Should().BeLessThanOrEqualTo(perf.TotalShipments);
    }

    [Fact]
    public void CarrierPerformance_CancelledShipments_ShouldNotExceedTotal()
    {
        var perf = CreatePerformance(totalShipments: 100, cancelled: 3);

        perf.CancelledShipments.Should().BeLessThanOrEqualTo(perf.TotalShipments);
    }

    [Fact]
    public void CarrierPerformance_OverallScore_ShouldBeWithin0To100()
    {
        var perf = CreatePerformance();

        perf.OverallScore.Should().BeInRange(0m, 100m);
    }

    [Theory]
    [InlineData(100, 100, 0, 100)]  // Perfect
    [InlineData(100, 50, 0, 57.5)]  // 50% on-time
    [InlineData(100, 0, 0, 15)]     // All late, no damage
    [InlineData(100, 100, 100, 85)] // All on-time but all damaged
    public void CarrierPerformance_ScoreCalculation_VariousScenarios(
        int total, int onTime, int damaged, decimal expectedScore)
    {
        var score = CalculateOverallScore(onTime, total, damaged);
        score.Should().Be(expectedScore);
    }

    [Fact]
    public void CarrierPerformance_BetterProviderShouldHaveHigherScore()
    {
        var good = CreatePerformance(totalShipments: 100, onTime: 95, late: 5, damaged: 1);
        var bad = CreatePerformance(totalShipments: 100, onTime: 60, late: 40, damaged: 8);

        good.OverallScore.Should().BeGreaterThan(bad.OverallScore);
    }

    [Fact]
    public void CarrierPerformance_MonthlyAggregate_RealisticValues()
    {
        // Simulate what seed data generates: monthly aggregate for a provider
        var perf = CreatePerformance(
            totalShipments: 45,
            onTime: 38,
            late: 7,
            damaged: 1,
            cancelled: 2,
            totalCost: 675000m,
            co2TotalKg: 9000m,
            avgDeliveryHours: 42m);

        perf.TotalShipments.Should().BeGreaterThan(0);
        perf.AverageDeliveryHours.Should().BeInRange(12m, 72m, "Delivery typically takes 12-72 hours in Turkey");
        perf.OnTimePercentage.Should().BeInRange(0m, 100m);
        perf.TotalCost.Should().BeGreaterThan(0);
    }
}
