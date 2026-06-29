using System.Diagnostics;
using Klc.LogicRoute.Application.RouteOptimization.Models;
using Klc.LogicRoute.Application.RouteOptimization.Services;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Pipeline;

public class AutoRouteService : IAutoRouteService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IVrpSolverService _vrpSolverService;
    private readonly IRouteOptimizationRepository _optimizationRepository;
    private readonly ILogger<AutoRouteService> _logger;

    // Default depot coordinates (Istanbul)
    private const double DefaultDepotLat = 41.0082;
    private const double DefaultDepotLng = 28.9784;

    public AutoRouteService(
        IOrderRepository orderRepository,
        IVehicleRepository vehicleRepository,
        IVrpSolverService vrpSolverService,
        IRouteOptimizationRepository optimizationRepository,
        ILogger<AutoRouteService> logger)
    {
        _orderRepository = orderRepository;
        _vehicleRepository = vehicleRepository;
        _vrpSolverService = vrpSolverService;
        _optimizationRepository = optimizationRepository;
        _logger = logger;
    }

    public async Task<Guid> OptimizeAsync(List<Guid> orderIds, Guid tenantId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("AutoRoute starting for {OrderCount} orders, tenant {TenantId}",
            orderIds.Count, tenantId);

        // Fetch orders
        var orders = new List<Order>();
        foreach (var orderId in orderIds)
        {
            var order = await _orderRepository.GetByIdAsync(orderId, tenantId);
            if (order is not null && order.DestinationLat.HasValue && order.DestinationLng.HasValue)
            {
                orders.Add(order);
            }
            else
            {
                _logger.LogWarning("Order {OrderId} skipped — not found or missing coordinates", orderId);
            }
        }

        if (orders.Count == 0)
            throw new InvalidOperationException("No valid orders with coordinates found for optimization.");

        // Fetch available vehicles
        var allVehicles = await _vehicleRepository.GetAllAsync(tenantId);
        var activeVehicles = allVehicles.Where(v => v.IsActive).ToList();

        if (activeVehicles.Count == 0)
            throw new InvalidOperationException("No active vehicles available for optimization.");

        // Convert orders to VRP stops
        var vrpStops = orders.Select(o => new VrpStop(
            ShipmentId: o.Id,
            Lat: o.DestinationLat!.Value,
            Lng: o.DestinationLng!.Value,
            WeightKg: o.TotalWeightKg,
            VolumeM3: o.TotalVolumeM3,
            TimeWindowStart: o.RequestedDeliveryDate?.Date,
            TimeWindowEnd: o.RequestedDeliveryDate?.Date.AddHours(23).AddMinutes(59),
            ServiceMinutes: 15
        )).ToList();

        // Convert vehicles to VRP vehicles
        var vrpVehicles = activeVehicles.Select(v => new VrpVehicle(
            Id: v.Id,
            Plate: v.PlateNumber,
            CapacityKg: v.Tonnage ?? 5000m,
            CapacityM3: (v.Tonnage ?? 5000m) * 0.005m,
            DepotLat: DefaultDepotLat,
            DepotLng: DefaultDepotLng
        )).ToList();

        // Create optimization record
        var optimization = new RouteOptimizationResult
        {
            TenantId = tenantId,
            Name = $"AUTO-{DateTime.UtcNow:yyyyMMdd-HHmmss}",
            Status = "Solving",
            StopCount = vrpStops.Count,
            VehicleCount = vrpVehicles.Count,
            SolverType = "AutoPipeline-ORTools",
            CreatedBy = "pipeline"
        };
        await _optimizationRepository.CreateAsync(optimization);

        // Solve VRP
        var sw = Stopwatch.StartNew();
        VrpResult vrpResult;
        try
        {
            vrpResult = await _vrpSolverService.SolveAsync(
                new VrpRequest(vrpVehicles, vrpStops), cancellationToken);
        }
        catch (Exception ex)
        {
            optimization.Status = "Failed";
            optimization.UpdatedAt = DateTime.UtcNow;
            await _optimizationRepository.UpdateAsync(optimization);
            _logger.LogError(ex, "VRP solver failed for optimization {OptimizationId}", optimization.Id);
            throw;
        }
        sw.Stop();

        // Update optimization result
        optimization.Status = "Completed";
        optimization.TotalDistanceKm = vrpResult.TotalDistance;
        optimization.TotalDurationMinutes = vrpResult.TotalDuration;
        optimization.VehicleCount = vrpResult.Routes.Count;
        optimization.SolveTimeMs = sw.ElapsedMilliseconds;
        optimization.UpdatedAt = DateTime.UtcNow;
        await _optimizationRepository.UpdateAsync(optimization);

        // Persist routes and stops
        var sequenceOrder = 0;
        foreach (var route in vrpResult.Routes)
        {
            var optimizedRoute = new OptimizedRoute
            {
                TenantId = tenantId,
                OptimizationId = optimization.Id,
                VehicleId = route.VehicleId,
                VehiclePlate = route.VehiclePlate,
                SequenceOrder = ++sequenceOrder,
                TotalDistanceKm = route.TotalDistanceKm,
                TotalDurationMinutes = route.TotalDurationMinutes,
                TotalWeightKg = route.TotalWeightKg,
                TotalVolumeM3 = route.TotalVolumeM3,
                CreatedBy = "pipeline"
            };
            await _optimizationRepository.CreateRouteAsync(optimizedRoute);

            foreach (var stop in route.Stops)
            {
                var routeStop = new RouteStop
                {
                    TenantId = tenantId,
                    RouteId = optimizedRoute.Id,
                    ShipmentId = stop.ShipmentId,
                    StopOrder = stop.Order,
                    StopType = "Delivery",
                    Lat = stop.Lat,
                    Lng = stop.Lng,
                    ArrivalTime = stop.EstimatedArrival,
                    DepartureTime = stop.EstimatedDeparture,
                    CreatedBy = "pipeline"
                };
                await _optimizationRepository.CreateStopAsync(routeStop);
            }
        }

        // Update order statuses to ReadyForShipment
        foreach (var order in orders)
        {
            await _orderRepository.UpdateStatusAsync(order.Id, tenantId, (int)OrderStatus.ReadyForShipment);
        }

        _logger.LogInformation(
            "AutoRoute completed: {RouteCount} routes, {Distance:F1} km, {SolveTime}ms, {UnservedCount} unserved",
            vrpResult.Routes.Count, vrpResult.TotalDistance, sw.ElapsedMilliseconds, vrpResult.UnservedStops.Count);

        return optimization.Id;
    }
}
