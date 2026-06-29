using Klc.LogicRoute.Application.Pipeline.Models;
using Klc.LogicRoute.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Pipeline;

public class AutoBatchService(ILogger<AutoBatchService> logger) : IAutoBatchService
{
    public List<OrderBatch> GroupIntoBatches(
        IEnumerable<Order> pendingOrders,
        Guid tenantId,
        decimal maxVehicleCapacityKg = 8000m)
    {
        var batches = new List<OrderBatch>();
        var orders = pendingOrders.ToList();

        if (orders.Count == 0)
            return batches;

        // Group orders by: region (destination city) + delivery date + special requirements
        var groups = orders.GroupBy(o => new
        {
            Region = NormalizeRegion(o.DestinationCity),
            DeliveryDate = (o.RequestedDeliveryDate ?? DateTime.UtcNow.Date).Date,
            o.IsHazardous,
            o.RequiresColdChain
        });

        foreach (var group in groups)
        {
            var regionOrders = group.ToList();
            var batchSequence = 1;

            // Split into sub-batches if total weight exceeds max vehicle capacity
            var currentBatch = CreateBatch(
                group.Key.Region,
                group.Key.DeliveryDate,
                group.Key.IsHazardous,
                group.Key.RequiresColdChain,
                tenantId,
                batchSequence);

            foreach (var order in regionOrders)
            {
                // If adding this order would exceed capacity, finalize current batch and start a new one
                if (currentBatch.OrderIds.Count > 0 &&
                    currentBatch.TotalWeightKg + order.TotalWeightKg > maxVehicleCapacityKg)
                {
                    batches.Add(currentBatch);
                    batchSequence++;
                    currentBatch = CreateBatch(
                        group.Key.Region,
                        group.Key.DeliveryDate,
                        group.Key.IsHazardous,
                        group.Key.RequiresColdChain,
                        tenantId,
                        batchSequence);
                }

                currentBatch.OrderIds.Add(order.Id);
                currentBatch.TotalWeightKg += order.TotalWeightKg;
                currentBatch.TotalVolumeM3 += order.TotalVolumeM3;
            }

            // Add the last batch if it has orders
            if (currentBatch.OrderIds.Count > 0)
            {
                batches.Add(currentBatch);
            }
        }

        logger.LogInformation(
            "Auto-batch created {BatchCount} batches from {OrderCount} orders for tenant {TenantId}",
            batches.Count, orders.Count, tenantId);

        return batches;
    }

    private static OrderBatch CreateBatch(
        string region,
        DateTime deliveryDate,
        bool isHazardous,
        bool requiresColdChain,
        Guid tenantId,
        int sequence)
    {
        // Format: BATCH-20260629-IST-001
        var regionCode = GetRegionCode(region);
        var batchName = $"BATCH-{deliveryDate:yyyyMMdd}-{regionCode}-{sequence:D3}";

        return new OrderBatch
        {
            BatchName = batchName,
            Region = region,
            DeliveryDate = deliveryDate,
            IsHazardous = isHazardous,
            RequiresColdChain = requiresColdChain,
            TenantId = tenantId
        };
    }

    private static string NormalizeRegion(string? city)
    {
        if (string.IsNullOrWhiteSpace(city))
            return "UNKNOWN";

        return city.Trim().ToUpperInvariant();
    }

    private static string GetRegionCode(string region)
    {
        // Map major cities to short codes; fallback to first 3 chars
        return region.ToUpperInvariant() switch
        {
            "ISTANBUL" or "İSTANBUL" => "IST",
            "ANKARA" => "ANK",
            "IZMIR" or "İZMİR" => "IZM",
            "BURSA" => "BRS",
            "ANTALYA" => "ANT",
            "ADANA" => "ADA",
            "KONYA" => "KNY",
            "GAZIANTEP" or "GAZİANTEP" => "GAZ",
            "MERSIN" or "MERSİN" => "MRS",
            "KAYSERI" or "KAYSERİ" => "KAY",
            "UNKNOWN" => "UNK",
            _ => region.Length >= 3 ? region[..3] : region
        };
    }
}
