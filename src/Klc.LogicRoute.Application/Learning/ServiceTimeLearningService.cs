using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Learning.Models;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Learning;

/// <summary>
/// Learns how long a driver actually spends at each delivery point.
/// Groups by location (rounded lat/lng), time-of-day, and day-of-week.
/// Stores learned values in Redis for fast lookup by the VRP solver.
/// </summary>
public class ServiceTimeLearningService
{
    private readonly ICacheService _cache;
    private readonly ILogger<ServiceTimeLearningService> _logger;

    private const string KeyPrefix = "learned:service_time";
    private const string IndexKey = "learned:service_time:index";
    private const int LatLngDecimalPlaces = 3; // ~111m precision
    private const double DefaultServiceTimeMinutes = 15.0;

    public ServiceTimeLearningService(ICacheService cache, ILogger<ServiceTimeLearningService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Processes a batch of service-time observations from completed route stops.
    /// </summary>
    public async Task LearnFromObservationsAsync(IEnumerable<ServiceTimeObservation> observations)
    {
        // Group observations by rounded location
        var grouped = observations.GroupBy(o => GetLocationKey(o.Lat, o.Lng));

        foreach (var group in grouped)
        {
            var key = $"{KeyPrefix}:{group.Key}";
            var existing = await _cache.GetAsync<LearnedServiceTime>(key);

            var allTimes = group.Select(o => o.ServiceTimeMinutes).OrderBy(t => t).ToList();

            // Merge with existing data if available
            if (existing != null && existing.SampleCount > 0)
            {
                // Weighted merge: keep existing data influence but add new observations
                var totalSamples = existing.SampleCount + allTimes.Count;
                var weightedAvg = (existing.AverageMinutes * existing.SampleCount + allTimes.Sum()) / totalSamples;
                existing.AverageMinutes = Math.Round(weightedAvg, 1);
                existing.MedianMinutes = Math.Round(CalculateMedian(allTimes), 1);
                existing.P90Minutes = Math.Round(CalculatePercentile(allTimes, 90), 1);
                existing.SampleCount = totalSamples;
                existing.LastUpdated = DateTime.UtcNow;

                // Update time-of-day breakdown
                foreach (var obs in group)
                {
                    var bucket = GetTimeOfDayBucket(obs.Hour);
                    existing.ByTimeOfDay[bucket] = obs.ServiceTimeMinutes;
                }

                // Update day-of-week breakdown
                foreach (var dayGroup in group.GroupBy(o => (int)o.DayOfWeek))
                {
                    existing.ByDayOfWeek[dayGroup.Key] = Math.Round(dayGroup.Average(o => o.ServiceTimeMinutes), 1);
                }
            }
            else
            {
                var firstObs = group.First();
                existing = new LearnedServiceTime
                {
                    LatRounded = Math.Round(firstObs.Lat, LatLngDecimalPlaces),
                    LngRounded = Math.Round(firstObs.Lng, LatLngDecimalPlaces),
                    Address = firstObs.Address,
                    CustomerName = firstObs.CustomerName,
                    AverageMinutes = Math.Round(allTimes.Average(), 1),
                    MedianMinutes = Math.Round(CalculateMedian(allTimes), 1),
                    P90Minutes = Math.Round(CalculatePercentile(allTimes, 90), 1),
                    SampleCount = allTimes.Count,
                    LastUpdated = DateTime.UtcNow
                };

                foreach (var todGroup in group.GroupBy(o => GetTimeOfDayBucket(o.Hour)))
                    existing.ByTimeOfDay[todGroup.Key] = Math.Round(todGroup.Average(o => o.ServiceTimeMinutes), 1);

                foreach (var dayGroup in group.GroupBy(o => (int)o.DayOfWeek))
                    existing.ByDayOfWeek[dayGroup.Key] = Math.Round(dayGroup.Average(o => o.ServiceTimeMinutes), 1);
            }

            await _cache.SetAsync(key, existing, TimeSpan.FromDays(90));

            // Track this key in an index for enumeration
            var index = await _cache.GetAsync<HashSet<string>>(IndexKey) ?? new HashSet<string>();
            index.Add(group.Key);
            await _cache.SetAsync(IndexKey, index, TimeSpan.FromDays(90));
        }

        _logger.LogInformation("Learned service times from {Count} observations across {Locations} locations",
            observations.Count(), grouped.Count());
    }

    /// <summary>
    /// Returns the learned service time for a location, considering time-of-day if provided.
    /// Falls back to default 15 minutes if no learned data exists.
    /// </summary>
    public async Task<double> GetServiceTimeAsync(double lat, double lng, DateTime? arrivalTime = null)
    {
        var locationKey = GetLocationKey(lat, lng);
        var key = $"{KeyPrefix}:{locationKey}";
        var learned = await _cache.GetAsync<LearnedServiceTime>(key);

        if (learned == null)
            return DefaultServiceTimeMinutes;

        // If arrival time provided, try to use time-of-day specific value
        if (arrivalTime.HasValue)
        {
            var bucket = GetTimeOfDayBucket(arrivalTime.Value.Hour);
            if (learned.ByTimeOfDay.TryGetValue(bucket, out var todValue))
                return todValue;
        }

        // Fall back to overall average
        return learned.AverageMinutes;
    }

    /// <summary>
    /// Returns all learned service time entries.
    /// </summary>
    public async Task<IEnumerable<LearnedServiceTime>> GetAllAsync()
    {
        var index = await _cache.GetAsync<HashSet<string>>(IndexKey);
        if (index == null || index.Count == 0)
            return Enumerable.Empty<LearnedServiceTime>();

        var results = new List<LearnedServiceTime>();
        foreach (var locationKey in index)
        {
            var key = $"{KeyPrefix}:{locationKey}";
            var entry = await _cache.GetAsync<LearnedServiceTime>(key);
            if (entry != null)
                results.Add(entry);
        }
        return results;
    }

    public async Task<int> GetCountAsync()
    {
        var index = await _cache.GetAsync<HashSet<string>>(IndexKey);
        return index?.Count ?? 0;
    }

    private static string GetLocationKey(double lat, double lng)
    {
        var latR = Math.Round(lat, LatLngDecimalPlaces);
        var lngR = Math.Round(lng, LatLngDecimalPlaces);
        return $"{latR}:{lngR}";
    }

    private static string GetTimeOfDayBucket(int hour) => hour switch
    {
        >= 6 and < 12 => "Morning",
        >= 12 and < 14 => "Midday",
        >= 14 and < 18 => "Afternoon",
        _ => "Evening"
    };

    private static double CalculateMedian(List<double> sorted)
    {
        if (sorted.Count == 0) return 0;
        int mid = sorted.Count / 2;
        return sorted.Count % 2 == 0
            ? (sorted[mid - 1] + sorted[mid]) / 2.0
            : sorted[mid];
    }

    private static double CalculatePercentile(List<double> sorted, int percentile)
    {
        if (sorted.Count == 0) return 0;
        var index = (int)Math.Ceiling(percentile / 100.0 * sorted.Count) - 1;
        return sorted[Math.Max(0, Math.Min(index, sorted.Count - 1))];
    }
}
