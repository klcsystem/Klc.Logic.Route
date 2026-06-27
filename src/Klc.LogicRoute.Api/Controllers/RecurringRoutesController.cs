using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/recurring-routes")]
[Authorize]
public class RecurringRoutesController(
    IRecurringRouteRepository recurringRouteRepository,
    IRouteOptimizationRepository optimizationRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>
    /// Save an optimization result as a recurring route template.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<RecurringRoute>>> Create([FromBody] CreateRecurringRouteRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();

        // If sourceOptimizationId is provided, copy stops from that optimization
        List<RecurringRouteStop> templateStops = [];
        if (request.SourceOptimizationId.HasValue)
        {
            var optimization = await optimizationRepository.GetByIdAsync(request.SourceOptimizationId.Value, tenantId);
            if (optimization == null)
                return NotFound(ApiResponse<RecurringRoute>.Fail("Kaynak optimizasyon bulunamadi"));

            var stopOrder = 0;
            foreach (var route in optimization.Routes)
            {
                foreach (var stop in route.Stops)
                {
                    templateStops.Add(new RecurringRouteStop
                    {
                        TenantId = tenantId,
                        StopOrder = ++stopOrder,
                        StopType = stop.StopType,
                        Address = stop.Address,
                        Lat = stop.Lat,
                        Lng = stop.Lng,
                        TimeWindowStart = stop.TimeWindowStart?.ToString("HH:mm"),
                        TimeWindowEnd = stop.TimeWindowEnd?.ToString("HH:mm"),
                        ServiceTimeMinutes = stop.ServiceTimeMinutes,
                        CreatedBy = userId
                    });
                }
            }
        }

        // Also allow manually provided stops
        if (request.Stops != null)
        {
            var order = templateStops.Count;
            foreach (var s in request.Stops)
            {
                templateStops.Add(new RecurringRouteStop
                {
                    TenantId = tenantId,
                    StopOrder = ++order,
                    StopType = s.StopType ?? "Delivery",
                    Address = s.Address,
                    Lat = s.Lat,
                    Lng = s.Lng,
                    TimeWindowStart = s.TimeWindowStart,
                    TimeWindowEnd = s.TimeWindowEnd,
                    ServiceTimeMinutes = s.ServiceTimeMinutes,
                    CustomerName = s.CustomerName,
                    Notes = s.Notes,
                    CreatedBy = userId
                });
            }
        }

        var recurringRoute = new RecurringRoute
        {
            TenantId = tenantId,
            Name = request.Name,
            Schedule = request.Schedule ?? "Daily",
            DaysOfWeek = request.DaysOfWeek,
            IsActive = true,
            SourceOptimizationId = request.SourceOptimizationId,
            CreatedBy = userId
        };

        await recurringRouteRepository.CreateAsync(recurringRoute);

        foreach (var stop in templateStops)
        {
            stop.RecurringRouteId = recurringRoute.Id;
            await recurringRouteRepository.CreateStopAsync(stop);
        }

        recurringRoute.Stops = templateStops;
        return Ok(ApiResponse<RecurringRoute>.Ok(recurringRoute, "Tekrarlayan rota olusturuldu"));
    }

    /// <summary>
    /// List all recurring route templates.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<RecurringRoute>>>> GetAll([FromQuery] bool? activeOnly = null)
    {
        var tenantId = tenantProvider.GetTenantId();
        var results = await recurringRouteRepository.GetAllAsync(tenantId, activeOnly);
        return Ok(ApiResponse<IEnumerable<RecurringRoute>>.Ok(results));
    }

    /// <summary>
    /// Get a single recurring route template by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<RecurringRoute>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await recurringRouteRepository.GetByIdAsync(id, tenantId);
        if (result == null)
            return NotFound(ApiResponse<RecurringRoute>.Fail("Tekrarlayan rota bulunamadi"));
        return Ok(ApiResponse<RecurringRoute>.Ok(result));
    }

    /// <summary>
    /// Activate a recurring route — generates today's optimization from the template stops.
    /// </summary>
    [HttpPost("{id:guid}/activate")]
    public async Task<ActionResult<ApiResponse<RouteOptimizationResult>>> Activate(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();

        var recurring = await recurringRouteRepository.GetByIdAsync(id, tenantId);
        if (recurring == null)
            return NotFound(ApiResponse<RouteOptimizationResult>.Fail("Tekrarlayan rota bulunamadi"));

        if (!recurring.IsActive)
            return BadRequest(ApiResponse<RouteOptimizationResult>.Fail("Bu rota aktif degil"));

        // Check if schedule matches today
        if (!IsScheduleMatchToday(recurring))
            return BadRequest(ApiResponse<RouteOptimizationResult>.Fail("Bu rota bugun icin planlanmamis"));

        // Create a new optimization result from the template
        var optimization = new RouteOptimizationResult
        {
            TenantId = tenantId,
            Name = $"{recurring.Name} - {DateTime.UtcNow:yyyy-MM-dd}",
            Status = "Completed",
            StopCount = recurring.Stops.Count,
            VehicleCount = 1,
            SolverType = "RecurringTemplate",
            CreatedBy = userId
        };
        await optimizationRepository.CreateAsync(optimization);

        // Create a single route with all template stops
        var optimizedRoute = new OptimizedRoute
        {
            TenantId = tenantId,
            OptimizationId = optimization.Id,
            SequenceOrder = 1,
            CreatedBy = userId
        };
        await optimizationRepository.CreateRouteAsync(optimizedRoute);

        var today = DateTime.UtcNow.Date;
        foreach (var templateStop in recurring.Stops)
        {
            var routeStop = new RouteStop
            {
                TenantId = tenantId,
                RouteId = optimizedRoute.Id,
                StopOrder = templateStop.StopOrder,
                StopType = templateStop.StopType,
                Address = templateStop.Address,
                Lat = templateStop.Lat,
                Lng = templateStop.Lng,
                TimeWindowStart = ParseTimeOfDay(templateStop.TimeWindowStart, today),
                TimeWindowEnd = ParseTimeOfDay(templateStop.TimeWindowEnd, today),
                ServiceTimeMinutes = templateStop.ServiceTimeMinutes,
                CreatedBy = userId
            };
            await optimizationRepository.CreateStopAsync(routeStop);
        }

        // Update activation stats
        recurring.LastActivatedAt = DateTime.UtcNow;
        recurring.ActivationCount++;
        recurring.UpdatedAt = DateTime.UtcNow;
        recurring.UpdatedBy = userId;
        await recurringRouteRepository.UpdateAsync(recurring);

        var result = await optimizationRepository.GetByIdAsync(optimization.Id, tenantId);
        return Ok(ApiResponse<RouteOptimizationResult>.Ok(result!, "Rota sablondan olusturuldu"));
    }

    /// <summary>
    /// Soft-delete a recurring route template.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var existing = await recurringRouteRepository.GetByIdAsync(id, tenantId);
        if (existing == null)
            return NotFound(ApiResponse<object>.Fail("Tekrarlayan rota bulunamadi"));

        await recurringRouteRepository.DeleteAsync(id, tenantId);
        return Ok(ApiResponse<object>.Ok(new { deleted = true }, "Tekrarlayan rota silindi"));
    }

    /// <summary>
    /// Toggle active/inactive status for a recurring route.
    /// </summary>
    [HttpPut("{id:guid}/toggle")]
    public async Task<ActionResult<ApiResponse<RecurringRoute>>> Toggle(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();
        var existing = await recurringRouteRepository.GetByIdAsync(id, tenantId);
        if (existing == null)
            return NotFound(ApiResponse<RecurringRoute>.Fail("Tekrarlayan rota bulunamadi"));

        existing.IsActive = !existing.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = userId;
        await recurringRouteRepository.UpdateAsync(existing);

        return Ok(ApiResponse<RecurringRoute>.Ok(existing));
    }

    private static bool IsScheduleMatchToday(RecurringRoute recurring)
    {
        return recurring.Schedule switch
        {
            "Daily" => true,
            "Weekly" when !string.IsNullOrEmpty(recurring.DaysOfWeek) =>
                recurring.DaysOfWeek.Split(',', StringSplitOptions.TrimEntries)
                    .Contains(DateTime.UtcNow.DayOfWeek.ToString(), StringComparer.OrdinalIgnoreCase),
            "Monthly" => DateTime.UtcNow.Day == 1 || recurring.LastActivatedAt?.Month != DateTime.UtcNow.Month,
            _ => true
        };
    }

    private static DateTime? ParseTimeOfDay(string? timeStr, DateTime date)
    {
        if (string.IsNullOrEmpty(timeStr))
            return null;
        if (TimeSpan.TryParse(timeStr, out var time))
            return date.Add(time);
        return null;
    }
}

public class CreateRecurringRouteRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Schedule { get; set; } // Daily, Weekly, Monthly
    public string? DaysOfWeek { get; set; } // "Monday,Wednesday,Friday"
    public Guid? SourceOptimizationId { get; set; }
    public List<CreateRecurringRouteStopRequest>? Stops { get; set; }
}

public class CreateRecurringRouteStopRequest
{
    public string? StopType { get; set; }
    public string? Address { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string? TimeWindowStart { get; set; }
    public string? TimeWindowEnd { get; set; }
    public int ServiceTimeMinutes { get; set; }
    public string? CustomerName { get; set; }
    public string? Notes { get; set; }
}
