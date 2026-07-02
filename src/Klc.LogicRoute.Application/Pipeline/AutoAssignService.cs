using Klc.LogicRoute.Application.DriverSkillMatching;
using Klc.LogicRoute.Application.Notifications;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Pipeline;

public class AutoAssignService : IAutoAssignService
{
    private readonly IRouteOptimizationRepository _optimizationRepository;
    private readonly IDriverRepository _driverRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IDriverSkillMatcher _driverSkillMatcher;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AutoAssignService> _logger;

    public AutoAssignService(
        IRouteOptimizationRepository optimizationRepository,
        IDriverRepository driverRepository,
        IVehicleRepository vehicleRepository,
        IOrderRepository orderRepository,
        IDriverSkillMatcher driverSkillMatcher,
        INotificationService notificationService,
        ILogger<AutoAssignService> logger)
    {
        _optimizationRepository = optimizationRepository;
        _driverRepository = driverRepository;
        _vehicleRepository = vehicleRepository;
        _orderRepository = orderRepository;
        _driverSkillMatcher = driverSkillMatcher;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<AutoAssignSummary> AssignAsync(Guid optimizationId, Guid tenantId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("AutoAssign starting for optimization {OptimizationId}", optimizationId);

        var optimization = await _optimizationRepository.GetByIdAsync(optimizationId, tenantId);
        if (optimization is null)
            throw new InvalidOperationException($"Optimization result {optimizationId} not found.");

        var routes = (await _optimizationRepository.GetRoutesByOptimizationIdAsync(optimizationId, tenantId)).ToList();
        if (routes.Count == 0)
        {
            // Rota uretilememesi normal bir veri durumu (uygun arac yok vb.) — pipeline'i durdurmamali
            _logger.LogWarning("No routes found for optimization {OptimizationId}, skipping assignment", optimizationId);
            return new AutoAssignSummary(
                OptimizationId: optimizationId,
                RoutesAssigned: 0,
                DriversNotified: 0,
                OrdersUpdated: 0,
                Warnings: [$"No routes produced for optimization {optimizationId}; assignment skipped."]);
        }

        var allDrivers = await _driverRepository.GetAllAsync(tenantId);
        var activeDrivers = allDrivers.Where(d => d.IsActive).ToList();

        var warnings = new List<string>();
        var assignedDriverIds = new HashSet<Guid>();
        var routesAssigned = 0;
        var driversNotified = 0;
        var ordersUpdated = 0;

        foreach (var route in routes)
        {
            // Get stops for this route to determine skill requirements
            var stops = (await _optimizationRepository.GetStopsByRouteIdAsync(route.Id, tenantId)).ToList();

            // Determine if route requires special skills by checking associated orders
            var requiresHazmat = false;
            var requiresColdChain = false;
            var isHeavy = route.TotalWeightKg > 10000m;

            foreach (var stop in stops)
            {
                if (stop.ShipmentId.HasValue)
                {
                    var order = await _orderRepository.GetByIdAsync(stop.ShipmentId.Value, tenantId);
                    if (order is not null)
                    {
                        requiresHazmat = requiresHazmat || order.IsHazardous;
                        requiresColdChain = requiresColdChain || order.RequiresColdChain;
                    }
                }
            }

            // Find eligible drivers using skill matcher
            var eligibleDrivers = _driverSkillMatcher.GetEligibleDrivers(
                requiresHazmat, requiresColdChain, isHeavy, activeDrivers);

            // Exclude already-assigned drivers in this batch
            var availableDrivers = eligibleDrivers
                .Where(d => !assignedDriverIds.Contains(d.Id))
                .ToList();

            if (availableDrivers.Count == 0)
            {
                warnings.Add($"Route {route.VehiclePlate ?? route.Id.ToString()}: no eligible driver available.");
                _logger.LogWarning("No eligible driver for route {RouteId} (vehicle {VehiclePlate})",
                    route.Id, route.VehiclePlate);
                continue;
            }

            // Score drivers: preferred zone match, workload capacity
            var bestDriver = ScoreAndSelectDriver(availableDrivers, route, stops);
            assignedDriverIds.Add(bestDriver.Id);
            routesAssigned++;

            _logger.LogInformation("Route {RouteId} assigned to driver {DriverName} ({DriverId})",
                route.Id, bestDriver.FullName, bestDriver.Id);

            // Update order statuses to InShipment
            foreach (var stop in stops)
            {
                if (stop.ShipmentId.HasValue)
                {
                    await _orderRepository.UpdateStatusAsync(stop.ShipmentId.Value, tenantId, (int)OrderStatus.InShipment);
                    ordersUpdated++;
                }
            }

            // Send push notification to driver
            try
            {
                if (bestDriver.UserId.HasValue)
                {
                    await _notificationService.SendAsync(
                        tenantId,
                        bestDriver.UserId,
                        "Yeni Rota Atandı",
                        $"Size {stops.Count} duraklı bir rota atandı. Araç: {route.VehiclePlate}. Toplam mesafe: {route.TotalDistanceKm:F1} km.",
                        NotificationType.Info,
                        "OptimizedRoute",
                        route.Id);
                    driversNotified++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send notification to driver {DriverId}", bestDriver.Id);
                warnings.Add($"Notification failed for driver {bestDriver.FullName}.");
            }
        }

        _logger.LogInformation(
            "AutoAssign completed: {RoutesAssigned}/{TotalRoutes} routes assigned, {DriversNotified} notified, {OrdersUpdated} orders updated",
            routesAssigned, routes.Count, driversNotified, ordersUpdated);

        return new AutoAssignSummary(
            OptimizationId: optimizationId,
            RoutesAssigned: routesAssigned,
            DriversNotified: driversNotified,
            OrdersUpdated: ordersUpdated,
            Warnings: warnings);
    }

    /// <summary>
    /// Scores drivers by: preferred zone match, workload capacity, and general availability.
    /// Returns the best-scoring driver.
    /// </summary>
    private static Driver ScoreAndSelectDriver(List<Driver> drivers, OptimizedRoute route, List<RouteStop> stops)
    {
        if (drivers.Count == 1)
            return drivers[0];

        // Determine route zone from the first stop's rough city area
        var routeZone = DetermineRouteZone(stops);

        var scored = drivers.Select(d =>
        {
            var score = 0.0;

            // Preferred zone match (highest weight)
            if (!string.IsNullOrEmpty(routeZone))
            {
                var preferredZones = d.GetPreferredZoneList();
                if (preferredZones.Contains(routeZone, StringComparer.OrdinalIgnoreCase))
                    score += 50;
            }

            // Higher max working hours = more available
            score += (double)d.MaxWorkingHours;

            // More certifications = more versatile (tiebreaker)
            score += d.GetCertificationList().Count * 2;

            return (Driver: d, Score: score);
        })
        .OrderByDescending(x => x.Score)
        .ToList();

        return scored[0].Driver;
    }

    /// <summary>
    /// Determines a rough zone code from route stop coordinates.
    /// </summary>
    private static string? DetermineRouteZone(List<RouteStop> stops)
    {
        if (stops.Count == 0) return null;

        // Use the average latitude to determine a rough zone
        var avgLat = stops.Average(s => s.Lat);
        var avgLng = stops.Average(s => s.Lng);

        // Rough zone mapping for Turkey
        return (avgLat, avgLng) switch
        {
            ( > 40.5, < 30.0) => "Marmara",
            ( > 39.0, < 28.0) => "Ege",
            ( < 38.0, > 29.0 and < 33.0) => "Akdeniz",
            ( > 39.0, > 31.0 and < 37.0) => "IcAnadolu",
            ( > 39.0, > 37.0) => "Karadeniz",
            ( < 38.0, > 35.0) => "GuneyDogu",
            _ => null
        };
    }
}
