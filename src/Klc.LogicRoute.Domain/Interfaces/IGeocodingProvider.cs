namespace Klc.LogicRoute.Domain.Interfaces;

public interface IGeocodingProvider
{
    Task<GeocodingResult?> GeocodeAsync(string address, CancellationToken cancellationToken = default);
    Task<List<GeocodingResult>> SearchAsync(string query, int limit = 5, CancellationToken cancellationToken = default);
    Task<ReverseGeocodingResult?> ReverseGeocodeAsync(double latitude, double longitude, CancellationToken cancellationToken = default);
}

public record GeocodingResult(double Latitude, double Longitude, string? DisplayName = null);

public record ReverseGeocodingResult(
    string? Address,
    string? City,
    string? District,
    string? DisplayName);
