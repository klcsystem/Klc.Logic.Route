using System.Diagnostics;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.RouteOptimization.Models;
using Klc.LogicRoute.Application.RouteOptimization.Services;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/route-optimization")]
[Authorize]
public class RouteOptimizationController(
    IVrpSolverService vrpSolverService,
    IRouteOptimizationRepository optimizationRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpPost("solve")]
    public async Task<ActionResult<ApiResponse<RouteOptimizationResult>>> Solve([FromBody] VrpRequest request)
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

        // Return full result
        var fullResult = await optimizationRepository.GetByIdAsync(optimization.Id, tenantId);
        return Ok(ApiResponse<RouteOptimizationResult>.Ok(fullResult!));
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
}
