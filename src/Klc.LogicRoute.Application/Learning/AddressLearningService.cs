using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Learning.Models;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Learning;

/// <summary>
/// Learns actual delivery coordinates from GPS data.
/// When a delivery is completed and the driver's GPS position differs from the order's
/// destination coordinates by more than 100m, stores the actual GPS as a "learned address".
/// </summary>
public class AddressLearningService
{
    private readonly ICacheService _cache;
    private readonly ILogger<AddressLearningService> _logger;

    private const string KeyPrefixCustomer = "learned:address:customer";
    private const string KeyPrefixHash = "learned:address:hash";
    private const string IndexKey = "learned:address:index";
    private const double DeviationThresholdMeters = 100.0;
    private const double EarthRadiusKm = 6371.0;

    public AddressLearningService(ICacheService cache, ILogger<AddressLearningService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Checks whether a delivered order's GPS coordinates deviate from the order's destination,
    /// and if so, stores the actual GPS position as the learned address.
    /// </summary>
    public async Task LearnFromDeliveryAsync(
        Guid? customerId,
        string? customerName,
        string? destinationAddress,
        double orderLat, double orderLng,
        double actualLat, double actualLng)
    {
        var distanceMeters = HaversineDistanceMeters(orderLat, orderLng, actualLat, actualLng);

        if (distanceMeters <= DeviationThresholdMeters)
        {
            _logger.LogDebug(
                "Address deviation {Distance:F0}m is within threshold for customer {Customer}, skipping",
                distanceMeters, customerName ?? customerId?.ToString());
            return;
        }

        // Determine key: prefer customer ID, fall back to address hash
        string key;
        string indexEntry;
        if (customerId.HasValue && customerId.Value != Guid.Empty)
        {
            key = $"{KeyPrefixCustomer}:{customerId.Value}";
            indexEntry = $"customer:{customerId.Value}";
        }
        else
        {
            var addressHash = ComputeAddressHash(destinationAddress ?? "");
            key = $"{KeyPrefixHash}:{addressHash}";
            indexEntry = $"hash:{addressHash}";
        }

        // Check existing learned address and update with weighted average
        var existing = await _cache.GetAsync<LearnedAddress>(key);

        if (existing != null)
        {
            // Weighted average of existing and new observation
            var totalSamples = existing.SampleCount + 1;
            existing.LearnedLat = Math.Round(
                (existing.LearnedLat * existing.SampleCount + actualLat) / totalSamples, 6);
            existing.LearnedLng = Math.Round(
                (existing.LearnedLng * existing.SampleCount + actualLng) / totalSamples, 6);
            existing.DeviationMeters = Math.Round(
                HaversineDistanceMeters(existing.OriginalLat, existing.OriginalLng, existing.LearnedLat, existing.LearnedLng), 1);
            existing.SampleCount = totalSamples;
            existing.LastUpdated = DateTime.UtcNow;
        }
        else
        {
            existing = new LearnedAddress
            {
                Key = indexEntry,
                CustomerId = customerId,
                CustomerName = customerName,
                OriginalAddress = destinationAddress,
                OriginalLat = orderLat,
                OriginalLng = orderLng,
                LearnedLat = Math.Round(actualLat, 6),
                LearnedLng = Math.Round(actualLng, 6),
                DeviationMeters = Math.Round(distanceMeters, 1),
                SampleCount = 1,
                LastUpdated = DateTime.UtcNow
            };
        }

        await _cache.SetAsync(key, existing, TimeSpan.FromDays(180));

        // Update index
        var index = await _cache.GetAsync<HashSet<string>>(IndexKey) ?? new HashSet<string>();
        index.Add(indexEntry);
        await _cache.SetAsync(IndexKey, index, TimeSpan.FromDays(180));

        _logger.LogInformation(
            "Learned address correction for {Customer}: {Distance:F0}m deviation (lat={Lat}, lng={Lng})",
            customerName ?? customerId?.ToString(), distanceMeters, actualLat, actualLng);
    }

    /// <summary>
    /// Returns the learned GPS coordinates for a customer or address hash, or null if not learned.
    /// </summary>
    public async Task<(double lat, double lng)?> GetLearnedCoordinatesAsync(Guid? customerId, string? addressHash)
    {
        // Try customer ID first
        if (customerId.HasValue && customerId.Value != Guid.Empty)
        {
            var key = $"{KeyPrefixCustomer}:{customerId.Value}";
            var learned = await _cache.GetAsync<LearnedAddress>(key);
            if (learned != null)
                return (learned.LearnedLat, learned.LearnedLng);
        }

        // Try address hash
        if (!string.IsNullOrEmpty(addressHash))
        {
            var key = $"{KeyPrefixHash}:{addressHash}";
            var learned = await _cache.GetAsync<LearnedAddress>(key);
            if (learned != null)
                return (learned.LearnedLat, learned.LearnedLng);
        }

        return null;
    }

    /// <summary>
    /// Returns all learned address corrections.
    /// </summary>
    public async Task<IEnumerable<LearnedAddress>> GetAllAsync()
    {
        var index = await _cache.GetAsync<HashSet<string>>(IndexKey);
        if (index == null || index.Count == 0)
            return Enumerable.Empty<LearnedAddress>();

        var results = new List<LearnedAddress>();
        foreach (var entry in index)
        {
            var parts = entry.Split(':', 2);
            var prefix = parts[0] == "customer" ? KeyPrefixCustomer : KeyPrefixHash;
            var key = $"{prefix}:{parts[1]}";
            var learned = await _cache.GetAsync<LearnedAddress>(key);
            if (learned != null)
                results.Add(learned);
        }
        return results;
    }

    public async Task<int> GetCountAsync()
    {
        var index = await _cache.GetAsync<HashSet<string>>(IndexKey);
        return index?.Count ?? 0;
    }

    public static string ComputeAddressHash(string address)
    {
        var normalized = address.Trim().ToLowerInvariant()
            .Replace("  ", " ")
            .Replace("mah.", "mahallesi")
            .Replace("cad.", "caddesi")
            .Replace("sok.", "sokak");
        return Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(normalized)))[..16];
    }

    private static double HaversineDistanceMeters(double lat1, double lng1, double lat2, double lng2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusKm * c * 1000.0; // Convert to meters
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}
