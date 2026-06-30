namespace Klc.LogicRoute.Application.Learning;

public interface IDriverFamiliarityService
{
    /// <summary>
    /// Returns familiarity scores for a driver across all zones they have delivered to.
    /// Key = city/zone name, Value = delivery count (score).
    /// </summary>
    Task<Dictionary<string, int>> GetFamiliarityScoresAsync(Guid driverId);

    /// <summary>
    /// Returns the best driver ID for a given zone, based on historical delivery count.
    /// Returns null if no driver has familiarity with the zone.
    /// </summary>
    Task<Guid?> GetBestDriverForZoneAsync(string zone);

    /// <summary>
    /// Rebuilds the familiarity cache for all drivers from completed shipment data.
    /// </summary>
    Task RebuildFamiliarityAsync(Guid tenantId, CancellationToken ct = default);
}
