using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Learning;

/// <summary>
/// Analyzes completed deliveries per driver per region/city and builds familiarity scores.
/// Scores are cached in Redis with key pattern: learned:driver_familiarity:{driverId}:{city}
/// </summary>
public class DriverFamiliarityService(
    IShipmentRepository shipmentRepository,
    IDriverRepository driverRepository,
    ICacheService cacheService,
    ILogger<DriverFamiliarityService> logger) : IDriverFamiliarityService
{
    private const string CachePrefix = "learned:driver_familiarity";
    private const string DriverZonesKey = "learned:driver_zones:{0}";
    private const string ZoneDriversKey = "learned:zone_drivers:{0}";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(24);

    public async Task<Dictionary<string, int>> GetFamiliarityScoresAsync(Guid driverId)
    {
        // Try cache first
        var cacheKey = string.Format(DriverZonesKey, driverId);
        var cached = await cacheService.GetAsync<Dictionary<string, int>>(cacheKey);
        if (cached != null)
            return cached;

        // Return empty if not cached — data is built during rebuild
        return new Dictionary<string, int>();
    }

    public async Task<Guid?> GetBestDriverForZoneAsync(string zone)
    {
        var normalizedZone = NormalizeZone(zone);
        var cacheKey = string.Format(ZoneDriversKey, normalizedZone);
        var zoneDrivers = await cacheService.GetAsync<List<DriverFamiliarityEntry>>(cacheKey);

        if (zoneDrivers == null || zoneDrivers.Count == 0)
            return null;

        // Return driver with highest score
        return zoneDrivers.OrderByDescending(d => d.Score).First().DriverId;
    }

    public async Task RebuildFamiliarityAsync(Guid tenantId, CancellationToken ct = default)
    {
        logger.LogInformation("Rebuilding driver familiarity scores for tenant {TenantId}", tenantId);

        var drivers = await driverRepository.GetAllAsync(tenantId);
        var shipments = await shipmentRepository.GetAllAsync(tenantId, 1, 10000);

        // Only completed shipments with driver info and destination city
        var completedShipments = shipments
            .Where(s => s.Status == Domain.Enums.ShipmentStatus.Delivered && !string.IsNullOrEmpty(s.DriverName) && !string.IsNullOrEmpty(s.DestinationCity))
            .ToList();

        // Build driver name -> driver id mapping
        var driverNameMap = drivers.ToDictionary(d => d.FullName ?? "", d => d.Id, StringComparer.OrdinalIgnoreCase);

        // Build familiarity: driverId -> city -> count
        var familiarityMap = new Dictionary<Guid, Dictionary<string, int>>();
        // Also build zone -> drivers mapping
        var zoneDriversMap = new Dictionary<string, List<DriverFamiliarityEntry>>(StringComparer.OrdinalIgnoreCase);

        foreach (var shipment in completedShipments)
        {
            ct.ThrowIfCancellationRequested();

            // Try to find driver by name
            Guid? driverId = null;
            foreach (var kvp in driverNameMap)
            {
                if (string.Equals(kvp.Key, shipment.DriverName, StringComparison.OrdinalIgnoreCase))
                {
                    driverId = kvp.Value;
                    break;
                }
            }

            if (driverId == null)
                continue;

            var city = NormalizeZone(shipment.DestinationCity!);

            // Update driver -> zones
            if (!familiarityMap.ContainsKey(driverId.Value))
                familiarityMap[driverId.Value] = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            familiarityMap[driverId.Value].TryGetValue(city, out var count);
            familiarityMap[driverId.Value][city] = count + 1;
        }

        // Cache per-driver scores and per-city individual scores
        foreach (var (driverId, zones) in familiarityMap)
        {
            // Cache aggregated zones for driver
            var driverKey = string.Format(DriverZonesKey, driverId);
            await cacheService.SetAsync(driverKey, zones, CacheTtl);

            // Cache individual city scores
            foreach (var (city, score) in zones)
            {
                var individualKey = $"{CachePrefix}:{driverId}:{city}";
                await cacheService.SetAsync(individualKey, score, CacheTtl);

                // Build zone -> drivers
                if (!zoneDriversMap.ContainsKey(city))
                    zoneDriversMap[city] = new List<DriverFamiliarityEntry>();

                zoneDriversMap[city].Add(new DriverFamiliarityEntry { DriverId = driverId, Score = score });
            }
        }

        // Cache zone -> drivers
        foreach (var (zone, drivers2) in zoneDriversMap)
        {
            var zoneKey = string.Format(ZoneDriversKey, zone);
            await cacheService.SetAsync(zoneKey, drivers2.OrderByDescending(d => d.Score).ToList(), CacheTtl);
        }

        logger.LogInformation("Driver familiarity rebuild complete: {DriverCount} drivers, {ZoneCount} zones",
            familiarityMap.Count, zoneDriversMap.Count);
    }

    private static string NormalizeZone(string zone) =>
        zone.Trim().ToLowerInvariant().Replace(" ", "_");
}

public class DriverFamiliarityEntry
{
    public Guid DriverId { get; set; }
    public int Score { get; set; }
}
