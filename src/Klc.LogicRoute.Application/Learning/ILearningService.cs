using Klc.LogicRoute.Application.Learning.Models;

namespace Klc.LogicRoute.Application.Learning;

/// <summary>
/// Umbrella interface for the self-learning engine.
/// Coordinates service-time, address, and traffic-pattern learning.
/// </summary>
public interface ILearningService
{
    /// <summary>
    /// Processes all completed deliveries in the given time range and updates learned parameters.
    /// </summary>
    Task ProcessCompletedDeliveriesAsync(Guid tenantId, DateTime from, DateTime to, CancellationToken ct = default);

    /// <summary>
    /// Returns the learned service time (minutes) for a location, or null if not yet learned.
    /// </summary>
    Task<double?> GetLearnedServiceTimeAsync(double lat, double lng, DateTime? arrivalTime = null);

    /// <summary>
    /// Returns learned GPS coordinates for a customer/address, or null if not yet learned.
    /// </summary>
    Task<(double lat, double lng)?> GetLearnedAddressAsync(Guid? customerId, string? addressHash);

    /// <summary>
    /// Returns the learned traffic multiplier for a given time and region pair, or null if not yet learned.
    /// </summary>
    Task<double?> GetLearnedTrafficMultiplierAsync(DayOfWeek day, int hour, string? regionPair = null);

    /// <summary>
    /// Returns a summary of all learning data.
    /// </summary>
    Task<LearningSummary> GetSummaryAsync();

    /// <summary>
    /// Returns all learned service times.
    /// </summary>
    Task<IEnumerable<LearnedServiceTime>> GetAllServiceTimesAsync();

    /// <summary>
    /// Returns all learned address corrections.
    /// </summary>
    Task<IEnumerable<LearnedAddress>> GetAllAddressCorrectionsAsync();

    /// <summary>
    /// Returns all learned traffic patterns.
    /// </summary>
    Task<IEnumerable<LearnedTrafficPattern>> GetAllTrafficPatternsAsync();
}
