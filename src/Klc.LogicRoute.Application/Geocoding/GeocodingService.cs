using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Geocoding;

public interface IGeocodingService
{
    Task EnrichOrderCoordinatesAsync(Order order, CancellationToken cancellationToken = default);
}

public class GeocodingService(
    IGeocodingProvider geocodingProvider,
    ILogger<GeocodingService> logger) : IGeocodingService
{
    public async Task EnrichOrderCoordinatesAsync(Order order, CancellationToken cancellationToken = default)
    {
        // Fill origin coordinates if address exists but coordinates are missing
        if (!string.IsNullOrWhiteSpace(order.OriginAddress) && order.OriginLat is null or 0)
        {
            var query = BuildQuery(order.OriginAddress, order.OriginCity);
            var result = await geocodingProvider.GeocodeAsync(query, cancellationToken);
            if (result != null)
            {
                order.OriginLat = result.Latitude;
                order.OriginLng = result.Longitude;
                logger.LogDebug("Geocoded origin for order {OrderNumber}: {Lat},{Lng}",
                    order.OrderNumber, result.Latitude, result.Longitude);
            }
        }

        // Fill destination coordinates if address exists but coordinates are missing
        if (!string.IsNullOrWhiteSpace(order.DestinationAddress) && order.DestinationLat is null or 0)
        {
            var query = BuildQuery(order.DestinationAddress, order.DestinationCity);
            var result = await geocodingProvider.GeocodeAsync(query, cancellationToken);
            if (result != null)
            {
                order.DestinationLat = result.Latitude;
                order.DestinationLng = result.Longitude;
                logger.LogDebug("Geocoded destination for order {OrderNumber}: {Lat},{Lng}",
                    order.OrderNumber, result.Latitude, result.Longitude);
            }
        }
    }

    private static string BuildQuery(string address, string? city)
    {
        return string.IsNullOrWhiteSpace(city)
            ? $"{address}, Turkey"
            : $"{address}, {city}, Turkey";
    }
}
