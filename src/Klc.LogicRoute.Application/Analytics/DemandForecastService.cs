using Klc.LogicRoute.Application.Analytics.Models;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.Analytics;

public class DemandForecastService(IOrderRepository orderRepository) : IDemandForecastService
{
    private const int LookbackWeeks = 8;
    private const int MovingAverageWindow = 4;
    private const int OrdersPerVehiclePerDay = 15;

    public async Task<DemandForecastResult> ForecastAsync(Guid tenantId, int days = 7)
    {
        // Fetch historical orders (last N weeks)
        var allOrders = await orderRepository.GetAllAsync(tenantId, page: 1, pageSize: 10000);
        var orderList = allOrders.ToList();

        var now = DateTime.UtcNow.Date;
        var lookbackStart = now.AddDays(-LookbackWeeks * 7);

        // Group orders by date
        var dailyCounts = orderList
            .Where(o => o.CreatedAt >= lookbackStart && o.CreatedAt < now)
            .GroupBy(o => o.CreatedAt.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        // Build day-of-week seasonal factors
        var dayOfWeekCounts = new Dictionary<DayOfWeek, List<int>>();
        for (var d = lookbackStart; d < now; d = d.AddDays(1))
        {
            var dow = d.DayOfWeek;
            if (!dayOfWeekCounts.ContainsKey(dow))
                dayOfWeekCounts[dow] = [];
            dayOfWeekCounts[dow].Add(dailyCounts.GetValueOrDefault(d, 0));
        }

        // Overall average
        var totalDays = (now - lookbackStart).Days;
        var totalOrders = dailyCounts.Values.Sum();
        var overallAvg = totalDays > 0 ? (double)totalOrders / totalDays : 0;

        // Day-of-week averages (seasonal factors)
        var dowAverages = dayOfWeekCounts.ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value.Count > 0 ? kvp.Value.Average() : 0);

        var seasonalFactors = dowAverages.ToDictionary(
            kvp => kvp.Key,
            kvp => overallAvg > 0 ? kvp.Value / overallAvg : 1.0);

        // Simple moving average of last N weeks for trend
        var recentWeeklyTotals = new List<int>();
        for (var w = 0; w < LookbackWeeks; w++)
        {
            var weekStart = now.AddDays(-(w + 1) * 7);
            var weekEnd = now.AddDays(-w * 7);
            var weekTotal = dailyCounts
                .Where(kvp => kvp.Key >= weekStart && kvp.Key < weekEnd)
                .Sum(kvp => kvp.Value);
            recentWeeklyTotals.Add(weekTotal);
        }
        recentWeeklyTotals.Reverse();

        // Moving average over last MovingAverageWindow weeks
        var maValues = new List<double>();
        for (var i = MovingAverageWindow - 1; i < recentWeeklyTotals.Count; i++)
        {
            var window = recentWeeklyTotals.Skip(i - MovingAverageWindow + 1).Take(MovingAverageWindow);
            maValues.Add(window.Average());
        }

        // Trend: compare last MA to first MA
        var trendPercent = 0.0;
        if (maValues.Count >= 2 && maValues[0] > 0)
        {
            trendPercent = (maValues[^1] - maValues[0]) / maValues[0] * 100;
        }

        // Projected daily average (latest MA / 7 with trend adjustment)
        var projectedDailyAvg = maValues.Count > 0 ? maValues[^1] / 7.0 : overallAvg;
        var trendMultiplier = 1.0 + trendPercent / 100.0 * 0.1; // dampen trend
        projectedDailyAvg *= trendMultiplier;

        // Generate predictions
        var predictions = new List<DailyPrediction>();
        for (var i = 1; i <= days; i++)
        {
            var targetDate = now.AddDays(i);
            var dow = targetDate.DayOfWeek;
            var factor = seasonalFactors.GetValueOrDefault(dow, 1.0);
            var predicted = (int)Math.Round(projectedDailyAvg * factor);
            predicted = Math.Max(predicted, 0);

            // Confidence interval (simple: +/- standard deviation of that day-of-week)
            var dowValues = dayOfWeekCounts.GetValueOrDefault(dow, []);
            var stdDev = CalculateStdDev(dowValues);

            predictions.Add(new DailyPrediction
            {
                Date = targetDate,
                DayOfWeek = dow,
                PredictedOrderCount = predicted,
                ConfidenceLow = Math.Max(0, predicted - 1.96 * stdDev),
                ConfidenceHigh = predicted + 1.96 * stdDev,
                SeasonalFactor = Math.Round(factor, 2)
            });
        }

        // Busiest day
        var busiestDay = seasonalFactors.Count > 0
            ? seasonalFactors.MaxBy(kvp => kvp.Value).Key
            : DayOfWeek.Monday;

        // Recommended vehicle count (peak day / orders-per-vehicle)
        var peakOrderCount = predictions.Count > 0 ? predictions.Max(p => p.PredictedOrderCount) : 0;
        var recommendedVehicles = Math.Max(1, (int)Math.Ceiling((double)peakOrderCount / OrdersPerVehiclePerDay));

        return new DemandForecastResult
        {
            DailyPredictions = predictions,
            BusiestDay = busiestDay,
            RecommendedVehicleCount = recommendedVehicles,
            AverageOrdersPerDay = Math.Round(projectedDailyAvg, 1),
            TrendPercent = Math.Round(trendPercent, 1)
        };
    }

    public async Task<IEnumerable<RegionDemand>> GetDemandByRegionAsync(Guid tenantId, int lookbackDays = 30)
    {
        var allOrders = await orderRepository.GetAllAsync(tenantId, page: 1, pageSize: 10000);
        var orderList = allOrders.ToList();

        var now = DateTime.UtcNow.Date;
        var cutoff = now.AddDays(-lookbackDays);
        var halfCutoff = now.AddDays(-lookbackDays / 2);

        var recentOrders = orderList.Where(o => o.CreatedAt >= cutoff).ToList();

        var regionGroups = recentOrders
            .Where(o => !string.IsNullOrWhiteSpace(o.DestinationCity))
            .GroupBy(o => o.DestinationCity!.Trim())
            .Select(g =>
            {
                var firstHalf = g.Count(o => o.CreatedAt < halfCutoff);
                var secondHalf = g.Count(o => o.CreatedAt >= halfCutoff);
                var growthPercent = firstHalf > 0
                    ? (double)(secondHalf - firstHalf) / firstHalf * 100
                    : secondHalf > 0 ? 100 : 0;

                return new RegionDemand
                {
                    City = g.Key,
                    OrderCount = g.Count(),
                    TotalWeightKg = g.Sum(o => o.TotalWeightKg),
                    TotalVolumeM3 = g.Sum(o => o.TotalVolumeM3),
                    AverageOrdersPerDay = Math.Round((double)g.Count() / lookbackDays, 1),
                    GrowthPercent = Math.Round(growthPercent, 1)
                };
            })
            .OrderByDescending(r => r.OrderCount)
            .ToList();

        return regionGroups;
    }

    private static double CalculateStdDev(List<int> values)
    {
        if (values.Count < 2) return 0;
        var avg = values.Average();
        var sumSquares = values.Sum(v => (v - avg) * (v - avg));
        return Math.Sqrt(sumSquares / (values.Count - 1));
    }
}
