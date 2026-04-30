using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Providers;

public interface IProviderApiAdapter
{
    string ProviderCode { get; }
    Task<bool> TestConnectionAsync(string apiBaseUrl, string apiKey);
    Task<ProviderQuoteResponse?> GetQuoteAsync(string apiBaseUrl, string apiKey, ProviderQuoteRequest request);
    Task<string?> CreateShipmentAsync(string apiBaseUrl, string apiKey, ProviderShipmentRequest request);
    Task<ProviderTrackingResponse?> TrackAsync(string apiBaseUrl, string apiKey, string trackingNumber);
}

public record ProviderQuoteRequest(
    string OriginCity, string DestinationCity,
    decimal WeightKg, decimal VolumeM3, int Pallets,
    bool IsHazardous, bool RequiresColdChain);

public record ProviderQuoteResponse(
    decimal Price, string Currency, string VehicleType, int EstimatedHours);

public record ProviderShipmentRequest(
    string OriginAddress, string OriginCity,
    string DestinationAddress, string DestinationCity,
    decimal WeightKg, decimal VolumeM3, int Pallets,
    string? PickupDate);

public record ProviderTrackingResponse(
    string Status, string? CurrentLocation, DateTime? EstimatedDelivery);

public class YoldaProviderAdapter(ILogger<YoldaProviderAdapter> logger) : IProviderApiAdapter
{
    public string ProviderCode => "YOLDA";

    public Task<bool> TestConnectionAsync(string apiBaseUrl, string apiKey)
    {
        logger.LogInformation("Yolda stub: Testing API connection to {Url}", apiBaseUrl);
        return Task.FromResult(true);
    }

    public Task<ProviderQuoteResponse?> GetQuoteAsync(string apiBaseUrl, string apiKey, ProviderQuoteRequest request)
    {
        logger.LogInformation("Yolda stub: Getting quote for {Origin} -> {Destination}, {Weight}kg",
            request.OriginCity, request.DestinationCity, request.WeightKg);
        var response = new ProviderQuoteResponse(
            Price: request.WeightKg * 2.5m,
            Currency: "TRY",
            VehicleType: request.WeightKg > 8000 ? "Tir" : "Kamyon",
            EstimatedHours: 24);
        return Task.FromResult<ProviderQuoteResponse?>(response);
    }

    public Task<string?> CreateShipmentAsync(string apiBaseUrl, string apiKey, ProviderShipmentRequest request)
    {
        logger.LogInformation("Yolda stub: Creating shipment {Origin} -> {Destination}",
            request.OriginCity, request.DestinationCity);
        return Task.FromResult<string?>($"YLD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}");
    }

    public Task<ProviderTrackingResponse?> TrackAsync(string apiBaseUrl, string apiKey, string trackingNumber)
    {
        logger.LogInformation("Yolda stub: Tracking {TrackingNumber}", trackingNumber);
        return Task.FromResult<ProviderTrackingResponse?>(
            new ProviderTrackingResponse("InTransit", "Ankara", DateTime.UtcNow.AddHours(12)));
    }
}
