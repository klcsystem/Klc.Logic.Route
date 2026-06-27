using System.Diagnostics;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.RouteOptimization.Models;
using Klc.LogicRoute.Application.RouteOptimization.Services;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/route-optimization")]
[Authorize]
public class RouteOptimizationController(
    IVrpSolverService vrpSolverService,
    IPlannedVsActualService plannedVsActualService,
    IDynamicRerouteService dynamicRerouteService,
    IRouteOptimizationRepository optimizationRepository,
    IVehicleRepository vehicleRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet("vehicles")]
    public async Task<ActionResult<ApiResponse<object>>> GetVehicles()
    {
        var tenantId = tenantProvider.GetTenantId();
        var vehicles = await vehicleRepository.GetAllAsync(tenantId);
        var result = vehicles.Select(v => new
        {
            id = v.Id.ToString(),
            plateNumber = v.PlateNumber,
            capacityKg = v.Tonnage ?? 5000m,
            capacityM3 = (v.Tonnage ?? 5000m) * 0.005m,
            costPerKm = v.VehicleType switch
            {
                VehicleCategory.Tir => 18.0,
                VehicleCategory.Kamyon => 12.5,
                VehicleCategory.Kamyonet => 8.0,
                VehicleCategory.Frigorifik => 16.0,
                _ => 10.0
            },
            startLat = 41.0082,
            startLng = 28.9784,
            available = v.IsActive,
            vehicleType = v.VehicleType.ToString(),
            bodyType = v.BodyType,
        });
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("solve")]
    public async Task<ActionResult<ApiResponse<object>>> Solve([FromBody] VrpRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();

        var optimization = new RouteOptimizationResult
        {
            TenantId = tenantId,
            Name = $"OPT-{DateTime.UtcNow:yyyyMMdd-HHmmss}",
            Status = "Solving",
            StopCount = request.Stops.Count,
            VehicleCount = request.Vehicles.Count,
            SolverType = "NearestNeighbor+2Opt",
            CreatedBy = userId
        };
        await optimizationRepository.CreateAsync(optimization);

        var sw = Stopwatch.StartNew();
        VrpResult vrpResult;
        try
        {
            vrpResult = await vrpSolverService.SolveAsync(request);
        }
        catch (Exception ex)
        {
            optimization.Status = "Failed";
            optimization.UpdatedAt = DateTime.UtcNow;
            await optimizationRepository.UpdateAsync(optimization);
            return BadRequest(ApiResponse<RouteOptimizationResult>.Fail($"Optimizasyon basarisiz: {ex.Message}"));
        }
        sw.Stop();

        optimization.Status = "Completed";
        optimization.TotalDistanceKm = vrpResult.TotalDistance;
        optimization.TotalDurationMinutes = vrpResult.TotalDuration;
        optimization.VehicleCount = vrpResult.Routes.Count;
        optimization.SolveTimeMs = sw.ElapsedMilliseconds;
        optimization.UpdatedAt = DateTime.UtcNow;
        await optimizationRepository.UpdateAsync(optimization);

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
                CreatedBy = userId
            };
            await optimizationRepository.CreateRouteAsync(optimizedRoute);

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
                    CreatedBy = userId
                };
                await optimizationRepository.CreateStopAsync(routeStop);
            }
        }

        // Return VRP solution in frontend-expected format
        var totalCost = vrpResult.Routes.Sum(r => r.TotalDistanceKm * 12.5); // default cost/km
        var totalCapacity = request.Vehicles.Sum(v => (double)v.CapacityKg);
        var totalLoad = vrpResult.Routes.Sum(r => (double)r.TotalWeightKg);
        var utilization = totalCapacity > 0 ? totalLoad / totalCapacity * 100 : 0;

        var frontendSolution = new
        {
            routes = vrpResult.Routes.Select((r, idx) => new
            {
                vehicleId = r.VehicleId.ToString(),
                plateNumber = r.VehiclePlate,
                stops = r.Stops.Select(s => new
                {
                    stopId = s.ShipmentId.ToString(),
                    address = $"Durak #{s.Order}",
                    lat = s.Lat,
                    lng = s.Lng,
                    sequence = s.Order,
                    arrivalTime = s.EstimatedArrival?.ToString("HH:mm") ?? "",
                    departureTime = s.EstimatedDeparture?.ToString("HH:mm") ?? "",
                }),
                totalDistanceKm = r.TotalDistanceKm,
                totalDurationMin = r.TotalDurationMinutes,
                totalCost = r.TotalDistanceKm * 12.5,
                loadKg = r.TotalWeightKg,
                loadM3 = r.TotalVolumeM3,
                utilizationPercent = request.Vehicles
                    .Where(v => v.Id == r.VehicleId)
                    .Select(v => v.CapacityKg > 0 ? (double)r.TotalWeightKg / (double)v.CapacityKg * 100 : 0)
                    .FirstOrDefault(),
            }),
            totalDistanceKm = vrpResult.TotalDistance,
            totalDurationMin = vrpResult.TotalDuration,
            totalCost,
            vehicleUtilization = Math.Round(utilization),
            unassignedStops = vrpResult.UnservedStops.Select(s => s.ShipmentId.ToString()),
            co2SavedKg = vrpResult.TotalDistance * 0.12, // ~120g CO2/km saved estimate
        };

        return Ok(ApiResponse<object>.Ok(frontendSolution));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<RouteOptimizationResult>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await optimizationRepository.GetByIdAsync(id, tenantId);
        if (result == null)
            return NotFound(ApiResponse<RouteOptimizationResult>.Fail("Optimizasyon bulunamadi"));
        return Ok(ApiResponse<RouteOptimizationResult>.Ok(result));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<RouteOptimizationResult>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var tenantId = tenantProvider.GetTenantId();
        var results = await optimizationRepository.GetAllAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<RouteOptimizationResult>>.Ok(results));
    }

    [HttpGet("compare/{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Compare(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await optimizationRepository.GetByIdAsync(id, tenantId);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Optimizasyon bulunamadi"));

        // Compare optimized vs naive (sequential) routing
        var naiveDistance = result.Routes.Sum(r => r.Stops.Count) * 50.0; // rough estimate: 50km avg per stop
        var naiveDuration = naiveDistance / 60.0 * 60.0; // 60 km/h

        var comparison = new
        {
            Optimized = new { result.TotalDistanceKm, result.TotalDurationMinutes, result.VehicleCount },
            Naive = new { TotalDistanceKm = naiveDistance, TotalDurationMinutes = naiveDuration, result.VehicleCount },
            SavingsPercent = naiveDistance > 0 ? (1 - result.TotalDistanceKm / naiveDistance) * 100 : 0,
            SolverType = result.SolverType,
            SolveTimeMs = result.SolveTimeMs
        };

        return Ok(ApiResponse<object>.Ok(comparison));
    }

    [HttpGet("planned-vs-actual/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PlannedVsActualReport>>> PlannedVsActual(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var report = await plannedVsActualService.GenerateReportAsync(id, tenantId);
        if (report == null)
            return NotFound(ApiResponse<PlannedVsActualReport>.Fail("Optimizasyon bulunamadi"));
        return Ok(ApiResponse<PlannedVsActualReport>.Ok(report));
    }

    [HttpPost("reroute")]
    public async Task<ActionResult<ApiResponse<object>>> Reroute([FromBody] RerouteRequest request)
    {
        try
        {
            var result = await dynamicRerouteService.RerouteAsync(request);

            var response = new
            {
                vehicleId = result.Route.VehicleId.ToString(),
                plateNumber = result.Route.VehiclePlate,
                stops = result.Route.Stops.Select(s => new
                {
                    stopId = s.ShipmentId.ToString(),
                    address = $"Durak #{s.Order}",
                    lat = s.Lat,
                    lng = s.Lng,
                    sequence = s.Order,
                    arrivalTime = s.EstimatedArrival?.ToString("HH:mm") ?? "",
                    departureTime = s.EstimatedDeparture?.ToString("HH:mm") ?? "",
                    distanceFromPrevKm = s.DistanceFromPrevKm,
                    durationFromPrevMin = s.DurationFromPrevMinutes,
                }),
                totalDistanceKm = result.TotalDistanceKm,
                totalDurationMin = result.TotalDurationMinutes,
                stopsAdded = result.StopsAdded,
                stopsRemoved = result.StopsRemoved,
                reason = result.Reason,
                unassignedStops = result.UnservedStops.Select(s => s.ShipmentId.ToString()),
            };

            return Ok(ApiResponse<object>.Ok(response));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail($"Reroute basarisiz: {ex.Message}"));
        }
    }
}
