using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Learning.Models;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Learning;

/// <summary>
/// Learns real traffic patterns from historical delivery data.
/// Compares planned vs actual route durations and computes traffic multipliers
/// grouped by hour-of-day, day-of-week, and origin-destination region pair.
/// </summary>
public class TrafficPatternLearningService
{
    private readonly ICacheService _cache;
    private readonly ILogger<TrafficPatternLearningService> _logger;

    private const string KeyPrefix = "learned:traffic";
    private const string IndexKey = "learned:traffic:index";

    // Hardcoded multipliers from TrafficAwareDistanceProvider for comparison
    private static readonly Dictionary<string, double> HardcodedMultipliers = new()
    {
        { "weekday_7", 1.4 }, { "weekday_8", 1.4 },   // Morning rush
        { "weekday_17", 1.5 }, { "weekday_18", 1.5 },  // Evening rush
        { "weekday_22", 0.8 }, { "weekday_23", 0.8 },  // Night
        { "weekday_0", 0.8 }, { "weekday_1", 0.8 },
        { "weekday_2", 0.8 }, { "weekday_3", 0.8 },
        { "weekday_4", 0.8 }, { "weekday_5", 0.8 },
        { "weekend", 0.9 }
    };

    public TrafficPatternLearningService(ICacheService cache, ILogger<TrafficPatternLearningService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Learns traffic multipliers from a set of route duration observations.
    /// Each observation compares planned duration against actual duration.
    /// </summary>
    public async Task LearnFromRouteComparisonAsync(IEnumerable<TrafficObservation> observations)
    {
        var grouped = observations.GroupBy(o => GetTrafficKey(o.DayOfWeek, o.Hour, o.RegionPair));

        foreach (var group in grouped)
        {
            var obs = group.First();
            var cacheKey = $"{KeyPrefix}:{group.Key}";

            // Calculate actual multiplier: actual_duration / base_duration
            // If base_duration is the OSRM estimate, this gives us the real traffic factor
            var multipliers = group
                .Where(o => o.PlannedDurationMinutes > 0)
                .Select(o => o.ActualDurationMinutes / o.PlannedDurationMinutes)
                .ToList();

            if (multipliers.Count == 0)
                continue;

            var existing = await _cache.GetAsync<LearnedTrafficPattern>(cacheKey);

            double newMultiplier;
            int totalSamples;

            if (existing != null)
            {
                totalSamples = existing.SampleCount + multipliers.Count;
                // Weighted average
                newMultiplier = (existing.Multiplier * existing.SampleCount +
                                multipliers.Sum()) / totalSamples;
            }
            else
            {
                totalSamples = multipliers.Count;
                newMultiplier = multipliers.Average();
            }

            // Clamp to reasonable range [0.5, 3.0]
            newMultiplier = Math.Clamp(newMultiplier, 0.5, 3.0);

            var pattern = new LearnedTrafficPattern
            {
                DayOfWeek = (int)obs.DayOfWeek,
                DayName = obs.DayOfWeek.ToString(),
                Hour = obs.Hour,
                RegionPair = obs.RegionPair,
                Multiplier = Math.Round(newMultiplier, 3),
                HardcodedMultiplier = GetHardcodedMultiplier(obs.DayOfWeek, obs.Hour),
                SampleCount = totalSamples,
                LastUpdated = DateTime.UtcNow
            };

            await _cache.SetAsync(cacheKey, pattern, TimeSpan.FromDays(30));

            // Update index
            var index = await _cache.GetAsync<HashSet<string>>(IndexKey) ?? new HashSet<string>();
            index.Add(group.Key);
            await _cache.SetAsync(IndexKey, index, TimeSpan.FromDays(30));
        }

        _logger.LogInformation("Learned traffic patterns from {Count} observations across {Groups} time slots",
            observations.Count(), grouped.Count());
    }

    /// <summary>
    /// Returns the learned traffic multiplier for a given time and region pair.
    /// Returns null if no learned data exists (caller should fall back to hardcoded).
    /// </summary>
    public async Task<double?> GetMultiplierAsync(DayOfWeek day, int hour, string? regionPair = null)
    {
        // Try specific region pair first
        if (!string.IsNullOrEmpty(regionPair))
        {
            var specificKey = $"{KeyPrefix}:{GetTrafficKey(day, hour, regionPair)}";
            var specific = await _cache.GetAsync<LearnedTrafficPattern>(specificKey);
            if (specific != null)
                return specific.Multiplier;
        }

        // Fall back to general (no region pair)
        var generalKey = $"{KeyPrefix}:{GetTrafficKey(day, hour, null)}";
        var general = await _cache.GetAsync<LearnedTrafficPattern>(generalKey);
        return general?.Multiplier;
    }

    /// <summary>
    /// Returns all learned traffic patterns.
    /// </summary>
    public async Task<IEnumerable<LearnedTrafficPattern>> GetAllAsync()
    {
        var index = await _cache.GetAsync<HashSet<string>>(IndexKey);
        if (index == null || index.Count == 0)
            return Enumerable.Empty<LearnedTrafficPattern>();

        var results = new List<LearnedTrafficPattern>();
        foreach (var entry in index)
        {
            var key = $"{KeyPrefix}:{entry}";
            var pattern = await _cache.GetAsync<LearnedTrafficPattern>(key);
            if (pattern != null)
                results.Add(pattern);
        }
        return results.OrderBy(p => p.DayOfWeek).ThenBy(p => p.Hour);
    }

    public async Task<int> GetCountAsync()
    {
        var index = await _cache.GetAsync<HashSet<string>>(IndexKey);
        return index?.Count ?? 0;
    }

    private static string GetTrafficKey(DayOfWeek day, int hour, string? regionPair)
    {
        var regionSuffix = string.IsNullOrEmpty(regionPair) ? "general" : regionPair;
        return $"{(int)day}:{hour}:{regionSuffix}";
    }

    private static double GetHardcodedMultiplier(DayOfWeek day, int hour)
    {
        if (day is DayOfWeek.Saturday or DayOfWeek.Sunday)
            return 0.9;

        return hour switch
        {
            >= 7 and < 9 => 1.4,
            >= 17 and < 19 => 1.5,
            >= 22 or < 6 => 0.8,
            _ => 1.0
        };
    }
}

/// <summary>
/// Represents a single observation comparing planned vs actual route duration.
/// </summary>
public class TrafficObservation
{
    public DayOfWeek DayOfWeek { get; set; }
    public int Hour { get; set; }
    public string? RegionPair { get; set; }
    public double PlannedDurationMinutes { get; set; }
    public double ActualDurationMinutes { get; set; }
}
