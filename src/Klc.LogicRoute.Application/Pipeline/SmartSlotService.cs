using Klc.LogicRoute.Application.Pipeline.Models;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Pipeline;

public class SmartSlotService : ISmartSlotService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IRouteOptimizationRepository _optimizationRepository;
    private readonly ILogger<SmartSlotService> _logger;

    // Standard delivery time windows (2-hour blocks)
    private static readonly (TimeOnly Start, TimeOnly End, string Label)[] TimeWindows =
    [
        (new TimeOnly(8, 0), new TimeOnly(10, 0), "08:00-10:00"),
        (new TimeOnly(10, 0), new TimeOnly(12, 0), "10:00-12:00"),
        (new TimeOnly(12, 0), new TimeOnly(14, 0), "12:00-14:00"),
        (new TimeOnly(14, 0), new TimeOnly(16, 0), "14:00-16:00"),
        (new TimeOnly(16, 0), new TimeOnly(18, 0), "16:00-18:00"),
        (new TimeOnly(18, 0), new TimeOnly(20, 0), "18:00-20:00"),
    ];

    public SmartSlotService(
        IOrderRepository orderRepository,
        IRouteOptimizationRepository optimizationRepository,
        ILogger<SmartSlotService> logger)
    {
        _orderRepository = orderRepository;
        _optimizationRepository = optimizationRepository;
        _logger = logger;
    }

    public async Task<List<SmartSlot>> SuggestSlotsAsync(Guid orderId, DateOnly date, Guid tenantId)
    {
        var order = await _orderRepository.GetByIdAsync(orderId, tenantId);
        if (order is null)
            throw new InvalidOperationException($"Order {orderId} not found.");

        if (!order.DestinationLat.HasValue || !order.DestinationLng.HasValue)
            throw new InvalidOperationException($"Order {orderId} has no destination coordinates.");

        // Get existing optimized routes for this tenant
        var optimizations = await _optimizationRepository.GetAllAsync(tenantId, page: 1, pageSize: 50);
        var recentOptimizations = optimizations
            .Where(o => o.Status == "Completed")
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .ToList();

        // Collect all route stops to understand existing route patterns
        var allStops = new List<(double Lat, double Lng, DateTime? ArrivalTime)>();
        foreach (var opt in recentOptimizations)
        {
            var routes = await _optimizationRepository.GetRoutesByOptimizationIdAsync(opt.Id, tenantId);
            foreach (var route in routes)
            {
                var stops = await _optimizationRepository.GetStopsByRouteIdAsync(route.Id, tenantId);
                foreach (var stop in stops)
                {
                    allStops.Add((stop.Lat, stop.Lng, stop.ArrivalTime));
                }
            }
        }

        // Score each time window
        var slots = new List<SmartSlot>();

        foreach (var (start, end, label) in TimeWindows)
        {
            var detourMinutes = CalculateDetourMinutes(
                order.DestinationLat.Value, order.DestinationLng.Value,
                allStops, start, end);

            var discountPercentage = CalculateDiscount(detourMinutes);
            var costImpact = CalculateCostImpact(detourMinutes, order.TotalWeightKg);

            slots.Add(new SmartSlot
            {
                TimeWindow = label,
                StartTime = start,
                EndTime = end,
                DetourMinutes = Math.Round(detourMinutes, 1),
                DiscountPercentage = discountPercentage,
                CostImpact = costImpact,
                Reason = GetSlotReason(detourMinutes, label)
            });
        }

        // Rank by lowest detour (best fit for existing routes)
        slots = slots
            .OrderBy(s => s.DetourMinutes)
            .Select((s, i) =>
            {
                s.Rank = i + 1;
                s.IsRecommended = i == 0;
                return s;
            })
            .ToList();

        _logger.LogInformation(
            "SmartSlot suggestion for order {OrderId} on {Date}: {SlotCount} slots, best={BestSlot} ({BestDetour}min detour)",
            orderId, date, slots.Count,
            slots.FirstOrDefault()?.TimeWindow ?? "none",
            slots.FirstOrDefault()?.DetourMinutes ?? 0);

        return slots;
    }

    private static double CalculateDetourMinutes(
        double destLat, double destLng,
        List<(double Lat, double Lng, DateTime? ArrivalTime)> existingStops,
        TimeOnly windowStart, TimeOnly windowEnd)
    {
        if (existingStops.Count == 0)
            return 15.0; // No existing routes — baseline detour

        // Find nearby stops within the time window
        var nearbyStops = existingStops
            .Where(s =>
            {
                if (!s.ArrivalTime.HasValue) return true; // Include stops without time info
                var stopTime = TimeOnly.FromDateTime(s.ArrivalTime.Value);
                return stopTime >= windowStart && stopTime <= windowEnd;
            })
            .ToList();

        if (nearbyStops.Count == 0)
        {
            // No existing stops in this window — check distance to any stop
            var minDistance = existingStops.Min(s => HaversineKm(destLat, destLng, s.Lat, s.Lng));
            return minDistance * 3.0; // Rough: 3 min per km detour
        }

        // Find closest existing stop in this time window
        var closestDistance = nearbyStops.Min(s => HaversineKm(destLat, destLng, s.Lat, s.Lng));
        return closestDistance * 2.0; // 2 min per km when route already passes nearby
    }

    private static decimal CalculateDiscount(double detourMinutes)
    {
        // Lower detour = higher discount (carrier saves fuel)
        return detourMinutes switch
        {
            <= 5 => 15m,    // Very close to existing route
            <= 10 => 10m,
            <= 20 => 5m,
            <= 30 => 2m,
            _ => 0m
        };
    }

    private static decimal CalculateCostImpact(double detourMinutes, decimal weightKg)
    {
        // Estimated cost per detour minute, adjusted by weight
        var baseCostPerMinute = 2.5m; // TRY per minute
        var weightMultiplier = 1m + (weightKg / 5000m);
        return Math.Round(baseCostPerMinute * (decimal)detourMinutes * weightMultiplier, 2);
    }

    private static string GetSlotReason(double detourMinutes, string label)
    {
        return detourMinutes switch
        {
            <= 5 => $"{label} — Mevcut rotaya en yakin, minimum sapma",
            <= 15 => $"{label} — Mevcut rotaya yakin, dusuk sapma",
            <= 30 => $"{label} — Orta duzeyde sapma gerektirir",
            _ => $"{label} — Mevcut rotalardan uzak, yuksek sapma"
        };
    }

    private static double HaversineKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371.0;
        var dLat = ToRad(lat2 - lat1);
        var dLng = ToRad(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRad(double deg) => deg * Math.PI / 180.0;
}
