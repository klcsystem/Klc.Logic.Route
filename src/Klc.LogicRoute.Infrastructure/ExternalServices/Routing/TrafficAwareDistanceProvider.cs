using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Routing;

/// <summary>
/// Wraps the OSRM distance matrix provider and applies time-of-day traffic multipliers
/// to duration estimates. For solve operations OSRM is used as-is (fast, free).
/// For more accurate ETAs, durations are scaled based on rush hour patterns.
/// </summary>
public class TrafficAwareDistanceProvider : IDistanceMatrixProvider
{
    private readonly OsrmDistanceMatrixProvider _osrmProvider;
    private readonly ILogger<TrafficAwareDistanceProvider> _logger;

    public TrafficAwareDistanceProvider(
        OsrmDistanceMatrixProvider osrmProvider,
        ILogger<TrafficAwareDistanceProvider> logger)
    {
        _osrmProvider = osrmProvider;
        _logger = logger;
    }

    public async Task<DistanceMatrixResult> GetDistanceMatrixAsync(
        DistanceMatrixPoint[] points, CancellationToken cancellationToken = default)
    {
        var baseResult = await _osrmProvider.GetDistanceMatrixAsync(points, cancellationToken);

        var multiplier = GetTrafficMultiplier(DateTime.UtcNow);

        if (Math.Abs(multiplier - 1.0) < 0.001)
        {
            return baseResult;
        }

        _logger.LogDebug(
            "Applying traffic multiplier {Multiplier:F2}x to duration estimates",
            multiplier);

        var n = points.Length;
        var adjustedDurations = new double[n, n];

        for (var i = 0; i < n; i++)
        {
            for (var j = 0; j < n; j++)
            {
                adjustedDurations[i, j] = baseResult.Durations[i, j] * multiplier;
            }
        }

        return new DistanceMatrixResult(baseResult.Distances, adjustedDurations);
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
