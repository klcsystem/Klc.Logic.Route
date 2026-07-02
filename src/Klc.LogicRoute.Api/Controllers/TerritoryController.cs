using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.TerritoryPlanning;
using Klc.LogicRoute.Application.TerritoryPlanning.Models;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/territories")]
[Authorize]
public class TerritoryController(
    ITerritoryPlanningService territoryPlanningService,
    IOrderRepository orderRepository,
    IVehicleRepository vehicleRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>
    /// Plan territories by clustering delivery points into geographic zones.
    /// Accepts either order IDs (fetches coordinates from DB) or direct coordinate input.
    /// </summary>
    [HttpPost("plan")]
    public async Task<ActionResult<ApiResponse<TerritoryPlanResult>>> Plan([FromBody] TerritoryPlanRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();

        // Resolve delivery points
        List<DeliveryPoint> points;

        if (request.OrderIds != null && request.OrderIds.Count > 0)
        {
            points = new List<DeliveryPoint>();
            foreach (var orderId in request.OrderIds)
            {
                var order = await orderRepository.GetByIdAsync(orderId, tenantId);
                if (order == null) continue;
                if (!order.DestinationLat.HasValue || !order.DestinationLng.HasValue) continue;

                points.Add(new DeliveryPoint
                {
                    OrderId = order.Id,
                    Lat = order.DestinationLat.Value,
                    Lng = order.DestinationLng.Value,
                    WeightKg = (double)order.TotalWeightKg,
                    VolumeM3 = (double)order.TotalVolumeM3,
                    Address = order.DestinationAddress
                });
            }
        }
        else if (request.Points != null && request.Points.Count > 0)
        {
            points = request.Points;
        }
        else
        {
            return BadRequest(ApiResponse<TerritoryPlanResult>.Fail(
                "OrderIds veya Points listesi gereklidir."));
        }

        if (points.Count == 0)
        {
            return BadRequest(ApiResponse<TerritoryPlanResult>.Fail(
                "Geçerli koordinatlara sahip teslimat noktası bulunamadı."));
        }

        // Determine zone count
        int zoneCount;
        if (request.ZoneCount.HasValue && request.ZoneCount.Value > 0)
        {
            zoneCount = request.ZoneCount.Value;
        }
        else
        {
            // Default to number of active vehicles
            var vehicles = await vehicleRepository.GetAllAsync(tenantId);
            var activeVehicles = vehicles.Where(v => v.IsActive).ToList();
            zoneCount = activeVehicles.Count > 0 ? activeVehicles.Count : Math.Max(1, points.Count / 10);
        }

        try
        {
            var result = await territoryPlanningService.PlanAsync(points, zoneCount, request);

            // Assign vehicles to zones by matching capacity
            var allVehicles = await vehicleRepository.GetAllAsync(tenantId);
            var availableVehicles = allVehicles.Where(v => v.IsActive).OrderByDescending(v => v.Tonnage ?? 0).ToList();
            var sortedZones = result.Zones.OrderByDescending(z => z.TotalWeightKg).ToList();

            for (int i = 0; i < sortedZones.Count && i < availableVehicles.Count; i++)
            {
                sortedZones[i].SuggestedVehicleId = availableVehicles[i].Id;
                sortedZones[i].SuggestedVehiclePlate = availableVehicles[i].PlateNumber;
            }

            return Ok(ApiResponse<TerritoryPlanResult>.Ok(result));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<TerritoryPlanResult>.Fail(ex.Message));
        }
    }
}
