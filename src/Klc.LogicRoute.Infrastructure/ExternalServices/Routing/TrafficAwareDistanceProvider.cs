using Klc.LogicRoute.Application.Learning;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Routing;

/// <summary>
/// Wraps the OSRM distance matrix provider and applies time-of-day traffic multipliers
/// to duration estimates. For solve operations OSRM is used as-is (fast, free).
/// For more accurate ETAs, durations are scaled based on rush hour patterns.
///
/// Self-Learning: checks learned traffic multipliers first (from TrafficPatternLearningService),
/// falling back to hardcoded multipliers when no learned data is available.
/// </summary>
public class TrafficAwareDistanceProvider : IDistanceMatrixProvider
{
    private readonly OsrmDistanceMatrixProvider _osrmProvider;
    private readonly TrafficPatternLearningService _trafficLearning;
    private readonly ITrafficProfileProvider _trafficProfile;
    private readonly ILogger<TrafficAwareDistanceProvider> _logger;

    public TrafficAwareDistanceProvider(
        OsrmDistanceMatrixProvider osrmProvider,
        TrafficPatternLearningService trafficLearning,
        ITrafficProfileProvider trafficProfile,
        ILogger<TrafficAwareDistanceProvider> logger)
    {
        _osrmProvider = osrmProvider;
        _trafficLearning = trafficLearning;
        _trafficProfile = trafficProfile;
        _logger = logger;
    }

    public async Task<DistanceMatrixResult> GetDistanceMatrixAsync(
        DistanceMatrixPoint[] points, CancellationToken cancellationToken = default)
    {
        var baseResult = await _osrmProvider.GetDistanceMatrixAsync(points, cancellationToken);

        var localNow = DateTime.UtcNow.AddHours(3); // Türkiye saati (UTC+3)
        var globalMultiplier = await GetTrafficMultiplierWithLearningAsync(DateTime.UtcNow);

        // Her kalkış noktası için MEKANSAL çarpan: İBB profili varsa hücre-bazlı
        // (geohash6 × haftalık-saat), yoksa global (öğrenilen/hardcoded) çarpana düşer.
        var n = points.Length;
        var legMultiplier = new double[n];
        var anyProfile = false;

        for (var i = 0; i < n; i++)
        {
            var m = await _trafficProfile.GetSpeedMultiplierAsync(
                points[i].Lat, points[i].Lng, localNow, cancellationToken);
            if (m.HasValue) anyProfile = true;
            legMultiplier[i] = m ?? globalMultiplier;
        }

        // Hiç profil yoksa VE global ~1 ise matrise dokunma (sıfır regresyon).
        if (!anyProfile && Math.Abs(globalMultiplier - 1.0) < 0.001)
            return baseResult;

        var adjustedDurations = new double[n, n];
        for (var i = 0; i < n; i++)
        {
            for (var j = 0; j < n; j++)
            {
                adjustedDurations[i, j] = baseResult.Durations[i, j] * legMultiplier[i];
            }
        }

        _logger.LogDebug(
            "Trafik çarpanı uygulandı — global {Global:F2}x, mekansal profil: {Profile}",
            globalMultiplier, anyProfile);

        return new DistanceMatrixResult(baseResult.Distances, adjustedDurations);
    }

    /// <summary>
    /// Checks learned traffic multiplier first, falls back to hardcoded values.
    /// </summary>
    private async Task<double> GetTrafficMultiplierWithLearningAsync(DateTime utcNow)
    {
        var localTime = utcNow.AddHours(3); // Turkey time (UTC+3)
        var day = localTime.DayOfWeek;
        var hour = localTime.Hour;

        try
        {
            var learned = await _trafficLearning.GetMultiplierAsync(day, hour);
            if (learned.HasValue)
            {
                _logger.LogDebug(
                    "Using learned traffic multiplier {Multiplier:F3} for {Day} {Hour}:00",
                    learned.Value, day, hour);
                return learned.Value;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get learned traffic multiplier, using hardcoded fallback");
        }

        return GetTrafficMultiplier(utcNow);
    }

    /// <summary>
    /// Returns a traffic multiplier based on the current time of day and day of week.
    /// Weekday rush hours get higher multipliers, nights and weekends get lower ones.
    /// </summary>
    public static double GetTrafficMultiplier(DateTime utcNow)
    {
        // Convert to Turkey time (UTC+3) for local traffic patterns
        var localTime = utcNow.AddHours(3);
        var hour = localTime.Hour;
        var isWeekend = localTime.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;

        if (isWeekend)
            return 0.9;

        // Weekday time-of-day multipliers
        return hour switch
        {
            >= 7 and < 9 => 1.4,   // Morning rush
            >= 17 and < 19 => 1.5,  // Evening rush
            >= 22 or < 6 => 0.8,    // Night (low traffic)
            _ => 1.0                // Normal daytime
        };
    }
}
