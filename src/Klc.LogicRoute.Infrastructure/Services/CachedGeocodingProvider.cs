using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.Services;

public class CachedGeocodingProvider(
    NominatimGeocodingProvider inner,
    ICacheService cacheService,
    ILogger<CachedGeocodingProvider> logger) : IGeocodingProvider
{
    private const string CachePrefix = "geocode:";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromDays(30);

    public async Task<GeocodingResult?> GeocodeAsync(string address, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;

        var cacheKey = $"{CachePrefix}{address.Trim().ToLowerInvariant()}";
        var cached = await cacheService.GetAsync<GeocodingResult>(cacheKey);
        if (cached != null)
        {
            logger.LogDebug("Geocoding cache hit for: {Address}", address);
            return cached;
        }

        var result = await inner.GeocodeAsync(address, cancellationToken);
        if (result != null)
            await cacheService.SetAsync(cacheKey, result, CacheDuration);

        return result;
    }

    public async Task<List<GeocodingResult>> SearchAsync(string query, int limit = 5, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query)) return [];

        var cacheKey = $"{CachePrefix}search:{query.Trim().ToLowerInvariant()}:{limit}";
        var cached = await cacheService.GetAsync<List<GeocodingResult>>(cacheKey);
        if (cached != null)
        {
            logger.LogDebug("Search cache hit for: {Query}", query);
            return cached;
        }

        var results = await inner.SearchAsync(query, limit, cancellationToken);
        if (results.Count > 0)
            await cacheService.SetAsync(cacheKey, results, CacheDuration);

        return results;
    }

    public async Task<ReverseGeocodingResult?> ReverseGeocodeAsync(double latitude, double longitude, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{CachePrefix}rev:{latitude:F6},{longitude:F6}";
        var cached = await cacheService.GetAsync<ReverseGeocodingResult>(cacheKey);
        if (cached != null)
        {
            logger.LogDebug("Reverse geocoding cache hit for: {Lat},{Lng}", latitude, longitude);
            return cached;
        }

        var result = await inner.ReverseGeocodeAsync(latitude, longitude, cancellationToken);
        if (result != null)
            await cacheService.SetAsync(cacheKey, result, CacheDuration);

        return result;
    }
}
