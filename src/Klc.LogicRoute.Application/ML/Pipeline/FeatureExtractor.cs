using Klc.LogicRoute.Domain.Entities;
using Microsoft.ML.Data;

namespace Klc.LogicRoute.Application.ML.Pipeline;

public static class FeatureExtractor
{
    public static ShipmentFeatures Extract(Shipment shipment)
    {
        return new ShipmentFeatures
        {
            OriginCity = shipment.OriginCity ?? "unknown",
            DestinationCity = shipment.DestinationCity ?? "unknown",
            Weight = (float)shipment.ChargeableWeight,
            Volume = (float)shipment.TotalVolumeM3,
            ProviderId = shipment.SelectedProviderId?.ToString() ?? "none",
            DayOfWeek = (float)(shipment.RequestedPickupDate?.DayOfWeek ?? DateTime.UtcNow.DayOfWeek),
            Hour = (float)(shipment.RequestedPickupDate?.Hour ?? DateTime.UtcNow.Hour),
            IsHazardous = shipment.IsHazardous ? 1f : 0f,
            RequiresColdChain = shipment.RequiresColdChain ? 1f : 0f,
            PalletCount = (float)shipment.PalletCount,
            Priority = (float)shipment.Priority
        };
    }
}

public class ShipmentFeatures
{
    [LoadColumn(0)] public string OriginCity { get; set; } = string.Empty;
    [LoadColumn(1)] public string DestinationCity { get; set; } = string.Empty;
    [LoadColumn(2)] public float Weight { get; set; }
    [LoadColumn(3)] public float Volume { get; set; }
    [LoadColumn(4)] public string ProviderId { get; set; } = string.Empty;
    [LoadColumn(5)] public float DayOfWeek { get; set; }
    [LoadColumn(6)] public float Hour { get; set; }
    [LoadColumn(7)] public float IsHazardous { get; set; }
    [LoadColumn(8)] public float RequiresColdChain { get; set; }
    [LoadColumn(9)] public float PalletCount { get; set; }
    [LoadColumn(10)] public float Priority { get; set; }
    [LoadColumn(11)] public float DeliveryHours { get; set; } // Label
}
