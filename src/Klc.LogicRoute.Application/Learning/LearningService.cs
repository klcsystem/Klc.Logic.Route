using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Learning.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Learning;

/// <summary>
/// Orchestrates the three learning sub-services (service-time, address, traffic).
/// Processes completed deliveries and route data to update all learned parameters.
/// </summary>
public class LearningService : ILearningService
{
    private readonly ServiceTimeLearningService _serviceTimeLearning;
    private readonly AddressLearningService _addressLearning;
    private readonly TrafficPatternLearningService _trafficLearning;
    private readonly IRouteOptimizationRepository _routeRepo;
    private readonly IShipmentRepository _shipmentRepo;
    private readonly IDriverLocationRepository _driverLocationRepo;
    private readonly IOrderRepository _orderRepo;
    private readonly ICacheService _cache;
    private readonly ILogger<LearningService> _logger;

    private const string LastRunKey = "learned:last_training_run";
    private const string DataPointsKey = "learned:total_data_points";

    public LearningService(
        ServiceTimeLearningService serviceTimeLearning,
        AddressLearningService addressLearning,
        TrafficPatternLearningService trafficLearning,
        IRouteOptimizationRepository routeRepo,
        IShipmentRepository shipmentRepo,
        IDriverLocationRepository driverLocationRepo,
        IOrderRepository orderRepo,
        ICacheService cache,
        ILogger<LearningService> logger)
    {
        _serviceTimeLearning = serviceTimeLearning;
        _addressLearning = addressLearning;
        _trafficLearning = trafficLearning;
        _routeRepo = routeRepo;
        _shipmentRepo = shipmentRepo;
        _driverLocationRepo = driverLocationRepo;
        _orderRepo = orderRepo;
        _cache = cache;
        _logger = logger;
    }

    public async Task ProcessCompletedDeliveriesAsync(Guid tenantId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        _logger.LogInformation("Starting learning process for tenant {TenantId}, period {From} to {To}",
            tenantId, from, to);

        var totalProcessed = 0;

        try
        {
            // 1. Get all optimization results for the tenant
            var optimizations = await _routeRepo.GetAllAsync(tenantId, page: 1, pageSize: 500);

            foreach (var optimization in optimizations)
            {
                if (ct.IsCancellationRequested) break;

                var routes = await _routeRepo.GetRoutesByOptimizationIdAsync(optimization.Id, tenantId);

                foreach (var route in routes)
                {
                    var stops = (await _routeRepo.GetStopsByRouteIdAsync(route.Id, tenantId)).ToList();
                    if (stops.Count == 0) continue;

                    // Collect shipment IDs from stops
                    var shipmentIds = stops
                        .Where(s => s.ShipmentId.HasValue)
                        .Select(s => s.ShipmentId!.Value)
                        .Distinct()
                        .ToList();

                    if (shipmentIds.Count == 0) continue;

                    var shipments = (await _shipmentRepo.GetByIdsAsync(shipmentIds, tenantId)).ToDictionary(s => s.Id);
                    var driverLocations = (await _driverLocationRepo.GetByShipmentIdsAsync(shipmentIds, tenantId)).ToList();

                    var locationsByShipment = driverLocations
                        .Where(dl => dl.ShipmentId.HasValue)
                        .GroupBy(dl => dl.ShipmentId!.Value)
                        .ToDictionary(g => g.Key, g => g.OrderBy(l => l.RecordedAt).ToList());

                    // --- Task 1: Service Time Learning ---
                    var serviceTimeObs = ExtractServiceTimeObservations(stops, shipments, locationsByShipment);
                    if (serviceTimeObs.Count > 0)
                    {
                        await _serviceTimeLearning.LearnFromObservationsAsync(serviceTimeObs);
                        totalProcessed += serviceTimeObs.Count;
                    }

                    // --- Task 2: Address Learning ---
                    await LearnAddressesFromDeliveries(shipments, locationsByShipment, tenantId);

                    // --- Task 3: Traffic Pattern Learning ---
                    var trafficObs = ExtractTrafficObservations(route, stops, shipments, locationsByShipment);
                    if (trafficObs.Count > 0)
                    {
                        await _trafficLearning.LearnFromRouteComparisonAsync(trafficObs);
                        totalProcessed += trafficObs.Count;
                    }
                }
            }

            // Store metadata
            await _cache.SetAsync(LastRunKey, DateTime.UtcNow, TimeSpan.FromDays(365));
            var existingPoints = await _cache.GetAsync<int?>(DataPointsKey);
            await _cache.SetAsync(DataPointsKey, (existingPoints ?? 0) + totalProcessed, TimeSpan.FromDays(365));

            _logger.LogInformation("Learning process completed. Processed {Count} data points", totalProcessed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during learning process for tenant {TenantId}", tenantId);
            throw;
        }
    }

    public async Task<double?> GetLearnedServiceTimeAsync(double lat, double lng, DateTime? arrivalTime = null)
    {
        var time = await _serviceTimeLearning.GetServiceTimeAsync(lat, lng, arrivalTime);
        // Return null if it's the default (meaning nothing was learned)
        return Math.Abs(time - 15.0) < 0.01 ? null : time;
    }

    public async Task<(double lat, double lng)?> GetLearnedAddressAsync(Guid? customerId, string? addressHash)
    {
        return await _addressLearning.GetLearnedCoordinatesAsync(customerId, addressHash);
    }

    public async Task<double?> GetLearnedTrafficMultiplierAsync(DayOfWeek day, int hour, string? regionPair = null)
    {
        return await _trafficLearning.GetMultiplierAsync(day, hour, regionPair);
    }

    public async Task<LearningSummary> GetSummaryAsync()
    {
        var serviceTimeCount = await _serviceTimeLearning.GetCountAsync();
        var addressCount = await _addressLearning.GetCountAsync();
        var trafficCount = await _trafficLearning.GetCountAsync();
        var lastRun = await _cache.GetAsync<DateTime?>(LastRunKey);
        var dataPoints = await _cache.GetAsync<int?>(DataPointsKey);

        // Calculate accuracy improvement estimates based on sample counts
        var serviceTimeImprovement = serviceTimeCount > 10 ? Math.Min(serviceTimeCount * 0.5, 35.0) : 0;
        var etaImprovement = trafficCount > 5 ? Math.Min(trafficCount * 0.3, 25.0) : 0;

        return new LearningSummary
        {
            TotalServiceTimeLearned = serviceTimeCount,
            TotalAddressCorrected = addressCount,
            TotalTrafficPatterns = trafficCount,
            TotalDataPointsProcessed = dataPoints ?? 0,
            AverageServiceTimeAccuracyImprovement = Math.Round(serviceTimeImprovement, 1),
            AverageEtaAccuracyImprovement = Math.Round(etaImprovement, 1),
            LastTrainingRun = lastRun,
            NextScheduledRun = lastRun?.Date.AddDays(1) // Next midnight after last run
        };
    }

    public async Task<IEnumerable<LearnedServiceTime>> GetAllServiceTimesAsync()
        => await _serviceTimeLearning.GetAllAsync();

    public async Task<IEnumerable<LearnedAddress>> GetAllAddressCorrectionsAsync()
        => await _addressLearning.GetAllAsync();

    public async Task<IEnumerable<LearnedTrafficPattern>> GetAllTrafficPatternsAsync()
        => await _trafficLearning.GetAllAsync();

    // --- Private Helpers ---

    private static List<ServiceTimeObservation> ExtractServiceTimeObservations(
        List<RouteStop> stops,
        Dictionary<Guid, Shipment> shipments,
        Dictionary<Guid, List<DriverLocation>> locationsByShipment)
    {
        var observations = new List<ServiceTimeObservation>();

        foreach (var stop in stops)
        {
            // We need both arrival and departure to calculate service time
            if (!stop.ArrivalTime.HasValue || !stop.DepartureTime.HasValue)
                continue;

            // Also try to infer from GPS data: first location near stop = arrival, last = departure
            DateTime arrival = stop.ArrivalTime.Value;
            DateTime departure = stop.DepartureTime.Value;

            if (stop.ShipmentId.HasValue &&
                locationsByShipment.TryGetValue(stop.ShipmentId.Value, out var locations) &&
                locations.Count >= 2)
            {
                // Find GPS-based arrival (first location within 500m of stop)
                var nearStop = locations.Where(l =>
                    HaversineKm(l.Lat, l.Lng, stop.Lat, stop.Lng) < 0.5).ToList();

                if (nearStop.Count >= 2)
                {
                    arrival = nearStop.First().RecordedAt;
                    departure = nearStop.Last().RecordedAt;
                }
            }

            var serviceTime = (departure - arrival).TotalMinutes;
            if (serviceTime is <= 0 or > 240) // Ignore unreasonable values (0 or > 4 hours)
                continue;

            string? customerName = null;
            if (stop.ShipmentId.HasValue && shipments.TryGetValue(stop.ShipmentId.Value, out var shipment))
                customerName = shipment.DriverName; // Use as proxy; real customer comes from Order

            observations.Add(new ServiceTimeObservation
            {
                StopId = stop.Id,
                Lat = stop.Lat,
                Lng = stop.Lng,
                Address = stop.Address,
                CustomerName = customerName,
                ArrivalTime = arrival,
                DepartureTime = departure,
                ServiceTimeMinutes = Math.Round(serviceTime, 1),
                Hour = arrival.AddHours(3).Hour, // Convert to Turkey time
                DayOfWeek = arrival.AddHours(3).DayOfWeek
            });
        }

        return observations;
    }

    private async Task LearnAddressesFromDeliveries(
        Dictionary<Guid, Shipment> shipments,
        Dictionary<Guid, List<DriverLocation>> locationsByShipment,
        Guid tenantId)
    {
        foreach (var (shipmentId, shipment) in shipments)
        {
            // Only process delivered shipments
            if (shipment.Status != Domain.Enums.ShipmentStatus.Delivered)
                continue;

            // Need destination coordinates from the order
            if (!shipment.OrderId.HasValue)
                continue;

            var order = await _orderRepo.GetByIdAsync(shipment.OrderId.Value, tenantId);
            if (order?.DestinationLat == null || order.DestinationLng == null)
                continue;

            // Find driver's GPS position at delivery time
            double actualLat, actualLng;

            if (locationsByShipment.TryGetValue(shipmentId, out var locations) && locations.Count > 0)
            {
                // Use the last GPS position (closest to delivery time)
                var lastLoc = locations.Last();
                actualLat = lastLoc.Lat;
                actualLng = lastLoc.Lng;
            }
            else
            {
                continue; // No GPS data, can't learn
            }

            await _addressLearning.LearnFromDeliveryAsync(
                customerId: null, // Order doesn't have CustomerId; use address hash
                customerName: order.CustomerName,
                destinationAddress: order.DestinationAddress,
                orderLat: order.DestinationLat.Value,
                orderLng: order.DestinationLng.Value,
                actualLat: actualLat,
                actualLng: actualLng);
        }
    }

    private static List<TrafficObservation> ExtractTrafficObservations(
        OptimizedRoute route,
        List<RouteStop> stops,
        Dictionary<Guid, Shipment> shipments,
        Dictionary<Guid, List<DriverLocation>> locationsByShipment)
    {
        var observations = new List<TrafficObservation>();

        // Compare planned route duration vs actual
        var orderedStops = stops.OrderBy(s => s.StopOrder).ToList();
        if (orderedStops.Count < 2) return observations;

        // Determine the actual route start and end times from GPS or stop data
        DateTime? routeStart = null;
        DateTime? routeEnd = null;

        foreach (var stop in orderedStops)
        {
            if (stop.ArrivalTime.HasValue)
            {
                routeStart ??= stop.ArrivalTime.Value;
                routeEnd = stop.DepartureTime ?? stop.ArrivalTime.Value;
            }

            if (stop.ShipmentId.HasValue &&
                locationsByShipment.TryGetValue(stop.ShipmentId.Value, out var locs) &&
                locs.Count > 0)
            {
                var first = locs.First().RecordedAt;
                var last = locs.Last().RecordedAt;
                if (routeStart == null || first < routeStart) routeStart = first;
                if (routeEnd == null || last > routeEnd) routeEnd = last;
            }
        }

        if (!routeStart.HasValue || !routeEnd.HasValue)
            return observations;

        var actualDuration = (routeEnd.Value - routeStart.Value).TotalMinutes;
        if (actualDuration <= 0 || route.TotalDurationMinutes <= 0)
            return observations;

        // Convert to Turkey time for day/hour grouping
        var localStart = routeStart.Value.AddHours(3);

        // Determine region pair from origin/destination cities
        string? regionPair = null;
        var firstStop = orderedStops.First();
        var lastStop = orderedStops.Last();
        if (firstStop.ShipmentId.HasValue && lastStop.ShipmentId.HasValue)
        {
            shipments.TryGetValue(firstStop.ShipmentId.Value, out var firstShipment);
            shipments.TryGetValue(lastStop.ShipmentId.Value, out var lastShipment);
            if (firstShipment?.OriginCity != null && lastShipment?.DestinationCity != null)
                regionPair = $"{firstShipment.OriginCity}-{lastShipment.DestinationCity}";
        }

        observations.Add(new TrafficObservation
        {
            DayOfWeek = localStart.DayOfWeek,
            Hour = localStart.Hour,
            RegionPair = regionPair,
            PlannedDurationMinutes = route.TotalDurationMinutes,
            ActualDurationMinutes = actualDuration
        });

        // Also add a general (no region pair) observation
        if (regionPair != null)
        {
            observations.Add(new TrafficObservation
            {
                DayOfWeek = localStart.DayOfWeek,
                Hour = localStart.Hour,
                RegionPair = null,
                PlannedDurationMinutes = route.TotalDurationMinutes,
                ActualDurationMinutes = actualDuration
            });
        }

        return observations;
    }

    private static double HaversineKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371.0;
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLng = (lng2 - lng1) * Math.PI / 180.0;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
