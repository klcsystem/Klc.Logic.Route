using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.Services;

public class NominatimGeocodingProvider(
    HttpClient httpClient,
    ILogger<NominatimGeocodingProvider> logger) : IGeocodingProvider
{
    // Nominatim usage policy: max 1 request per second
    private static readonly SemaphoreSlim RateLimiter = new(1, 1);
    private static DateTime _lastRequestTime = DateTime.MinValue;

    public async Task<GeocodingResult?> GeocodeAsync(string address, CancellationToken cancellationToken = default)
    {
        var results = await SearchAsync(address, 1, cancellationToken);
        return results.Count > 0 ? results[0] : null;
    }

    public async Task<List<GeocodingResult>> SearchAsync(string query, int limit = 5, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query)) return [];

        await EnforceRateLimitAsync(cancellationToken);

        try
        {
            var encodedQuery = Uri.EscapeDataString(query.Trim());
            var url = $"search?q={encodedQuery}&format=jsonv2&limit={limit}&countrycodes=tr&addressdetails=1";

            var response = await httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();

            var results = await response.Content.ReadFromJsonAsync<NominatimSearchResult[]>(cancellationToken: cancellationToken);
            if (results == null || results.Length == 0)
            {
                logger.LogDebug("Nominatim returned no results for: {Query}", query);
                return [];
            }

            var geocodingResults = new List<GeocodingResult>();
            foreach (var r in results)
            {
                if (double.TryParse(r.Lat, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var lat) &&
                    double.TryParse(r.Lon, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var lng))
                {
                    geocodingResults.Add(new GeocodingResult(lat, lng, r.DisplayName));
                }
            }

            return geocodingResults;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Nominatim search failed for: {Query}", query);
            return [];
        }
    }

    public async Task<ReverseGeocodingResult?> ReverseGeocodeAsync(double latitude, double longitude, CancellationToken cancellationToken = default)
    {
        await EnforceRateLimitAsync(cancellationToken);

        try
        {
            var latStr = latitude.ToString(System.Globalization.CultureInfo.InvariantCulture);
            var lngStr = longitude.ToString(System.Globalization.CultureInfo.InvariantCulture);
            var url = $"reverse?lat={latStr}&lon={lngStr}&format=jsonv2&addressdetails=1";

            var response = await httpClient.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<NominatimSearchResult>(cancellationToken: cancellationToken);
            if (result == null) return null;

            var address = result.Address;
            var city = address?.Province ?? address?.City ?? address?.State;
            var district = address?.District ?? address?.Suburb ?? address?.Town ?? address?.County;
            var road = address?.Road;
            var houseNumber = address?.HouseNumber;

            var addressLine = road != null
                ? houseNumber != null ? $"{road} No:{houseNumber}" : road
                : null;

            return new ReverseGeocodingResult(
                Address: addressLine,
                City: city,
                District: district,
                DisplayName: result.DisplayName);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Nominatim reverse geocoding failed for: {Lat},{Lng}", latitude, longitude);
            return null;
        }
    }

    private static async Task EnforceRateLimitAsync(CancellationToken cancellationToken)
    {
        await RateLimiter.WaitAsync(cancellationToken);
        try
        {
            var elapsed = DateTime.UtcNow - _lastRequestTime;
            if (elapsed < TimeSpan.FromSeconds(1))
                await Task.Delay(TimeSpan.FromSeconds(1) - elapsed, cancellationToken);
            _lastRequestTime = DateTime.UtcNow;
        }
        finally
        {
            RateLimiter.Release();
        }
    }

    private class NominatimSearchResult
    {
        [JsonPropertyName("lat")]
        public string? Lat { get; set; }

        [JsonPropertyName("lon")]
        public string? Lon { get; set; }

        [JsonPropertyName("display_name")]
        public string? DisplayName { get; set; }

        [JsonPropertyName("address")]
        public NominatimAddress? Address { get; set; }
    }

    private class NominatimAddress
    {
        [JsonPropertyName("road")]
        public string? Road { get; set; }

        [JsonPropertyName("house_number")]
        public string? HouseNumber { get; set; }

        [JsonPropertyName("suburb")]
        public string? Suburb { get; set; }

        [JsonPropertyName("district")]
        public string? District { get; set; }

        [JsonPropertyName("town")]
        public string? Town { get; set; }

        [JsonPropertyName("county")]
        public string? County { get; set; }

        [JsonPropertyName("city")]
        public string? City { get; set; }

        [JsonPropertyName("province")]
        public string? Province { get; set; }

        [JsonPropertyName("state")]
        public string? State { get; set; }

        [JsonPropertyName("country")]
        public string? Country { get; set; }
    }
}
