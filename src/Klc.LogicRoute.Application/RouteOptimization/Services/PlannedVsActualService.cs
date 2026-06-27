using Klc.LogicRoute.Application.RouteOptimization.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.RouteOptimization.Services;

public class PlannedVsActualService(
    IRouteOptimizationRepository optimizationRepository,
    IDriverLocationRepository driverLocationRepository,
    IShipmentRepository shipmentRepository) : IPlannedVsActualService
{
    /// <summary>
    /// On-time threshold: a delivery within this many minutes of planned arrival is considered on-time.
    /// </summary>
    private const double OnTimeThresholdMinutes = 15.0;

    public async Task<PlannedVsActualReport?> GenerateReportAsync(Guid optimizationId, Guid tenantId)
    {
        var optimization = await optimizationRepository.GetByIdAsync(optimizationId, tenantId);
        if (optimization == null)
            return null;

        // Collect all shipment IDs from route stops
        var allStops = optimization.Routes.SelectMany(r => r.Stops).ToList();
        var shipmentIds = allStops
            .Where(s => s.ShipmentId.HasValue)
            .Select(s => s.ShipmentId!.Value)
            .Distinct()
            .ToList();

        // Fetch actual data: driver locations and shipments in parallel
        var driverLocationsTask = driverLocationRepository.GetByShipmentIdsAsync(shipmentIds, tenantId);
        var shipmentsTask = shipmentRepository.GetByIdsAsync(shipmentIds, tenantId);
        await Task.WhenAll(driverLocationsTask, shipmentsTask);

        var driverLocations = (await driverLocationsTask).ToList();
        var shipments = (await shipmentsTask).ToDictionary(s => s.Id);

        // Group driver locations by shipment for quick lookup
        var locationsByShipment = driverLocations
            .Where(dl => dl.ShipmentId.HasValue)
            .GroupBy(dl => dl.ShipmentId!.Value)
            .ToDictionary(g => g.Key, g => g.OrderBy(l => l.RecordedAt).ToList());

        var report = new PlannedVsActualReport
        {
            OptimizationId = optimizationId,
            OptimizationName = optimization.Name,
            PlannedTotalDistanceKm = optimization.TotalDistanceKm,
            PlannedTotalDurationMinutes = optimization.TotalDurationMinutes,
            PlannedVehicleCount = optimization.VehicleCount,
            PlannedStopCount = optimization.StopCount
        };

        double totalActualDistance = 0;
        double totalActualDuration = 0;
        int onTimeCount = 0;
        int lateCount = 0;
        int noDataCount = 0;
        var allDelays = new List<double>();

        foreach (var route in optimization.Routes)
        {
            var routeDetail = new RouteComparisonDetail
            {
                RouteId = route.Id,
                VehiclePlate = route.VehiclePlate,
                PlannedDistanceKm = route.TotalDistanceKm,
                PlannedDurationMinutes = route.TotalDurationMinutes
            };

            double routeActualDistance = 0;
            DateTime? routeFirstArrival = null;
            DateTime? routeLastDeparture = null;

            var orderedStops = route.Stops.OrderBy(s => s.StopOrder).ToList();

            for (int i = 0; i < orderedStops.Count; i++)
            {
                var stop = orderedStops[i];
                var stopDetail = new StopComparisonDetail
                {
                    StopId = stop.Id,
                    ShipmentId = stop.ShipmentId,
                    StopOrder = stop.StopOrder,
                    Address = stop.Address,
                    PlannedArrival = stop.ArrivalTime,
                    PlannedDeparture = stop.DepartureTime
                };

                if (stop.ShipmentId.HasValue && shipments.TryGetValue(stop.ShipmentId.Value, out var shipment))
                {
                    stopDetail.ShipmentNumber = shipment.ShipmentNumber;
                    stopDetail.ActualDelivery = shipment.ActualDeliveryDate;

                    // Try to find actual arrival from driver location data
                    if (locationsByShipment.TryGetValue(stop.ShipmentId.Value, out var locations) && locations.Count > 0)
                    {
                        // First location record near the stop is the arrival
                        var nearestArrival = FindArrivalLocation(locations, stop.Lat, stop.Lng);
                        if (nearestArrival != null)
                        {
                            stopDetail.ActualArrival = nearestArrival.RecordedAt;

                            if (routeFirstArrival == null || nearestArrival.RecordedAt < routeFirstArrival)
                                routeFirstArrival = nearestArrival.RecordedAt;

                            var lastLoc = locations.Last();
                            if (routeLastDeparture == null || lastLoc.RecordedAt > routeLastDeparture)
                                routeLastDeparture = lastLoc.RecordedAt;
                        }
                    }

                    // Use actual delivery date as fallback for arrival if no GPS data
                    stopDetail.ActualArrival ??= shipment.ActualDeliveryDate;

                    // Calculate delay
                    if (stopDetail.PlannedArrival.HasValue && stopDetail.ActualArrival.HasValue)
                    {
                        var delay = (stopDetail.ActualArrival.Value - stopDetail.PlannedArrival.Value).TotalMinutes;
                        stopDetail.DelayMinutes = Math.Round(delay, 1);

                        if (delay <= OnTimeThresholdMinutes)
                        {
                            stopDetail.Status = delay < -OnTimeThresholdMinutes ? "Early" : "OnTime";
                            onTimeCount++;
                        }
                        else
                        {
                            stopDetail.Status = "Late";
                            lateCount++;
                        }
                        allDelays.Add(delay);
                    }
                    else if (shipment.ActualDeliveryDate.HasValue)
                    {
                        // We have delivery but no planned arrival to compare
                        stopDetail.Status = "NoData";
                        noDataCount++;
                    }
                    else
                    {
                        stopDetail.Status = "NoData";
                        noDataCount++;
                    }
                }
                else
                {
                    stopDetail.Status = "NoData";
                    noDataCount++;
                }

                // Calculate actual distance from GPS trail between consecutive stops
                if (i > 0 && stop.ShipmentId.HasValue)
                {
                    var prevStop = orderedStops[i - 1];
                    routeActualDistance += CalculateGpsTrailDistance(
                        locationsByShipment, prevStop, stop);
                }

                routeDetail.Stops.Add(stopDetail);
            }

            // If no GPS trail distance, estimate from planned with variance
            if (routeActualDistance < 0.01)
                routeActualDistance = route.TotalDistanceKm;

            routeDetail.ActualDistanceKm = Math.Round(routeActualDistance, 2);

            // Calculate actual duration from first arrival to last departure
            if (routeFirstArrival.HasValue && routeLastDeparture.HasValue)
                routeDetail.ActualDurationMinutes = Math.Round(
                    (routeLastDeparture.Value - routeFirstArrival.Value).TotalMinutes, 1);
            else
                routeDetail.ActualDurationMinutes = route.TotalDurationMinutes;

            routeDetail.DistanceVarianceKm = Math.Round(
                routeDetail.ActualDistanceKm - routeDetail.PlannedDistanceKm, 2);
            routeDetail.DurationVarianceMinutes = Math.Round(
                routeDetail.ActualDurationMinutes - routeDetail.PlannedDurationMinutes, 1);

            totalActualDistance += routeDetail.ActualDistanceKm;
            totalActualDuration += routeDetail.ActualDurationMinutes;

            report.Routes.Add(routeDetail);
        }

        // Fill in report totals
        report.ActualTotalDistanceKm = Math.Round(totalActualDistance, 2);
        report.ActualTotalDurationMinutes = Math.Round(totalActualDuration, 1);
        report.ActualDeliveredCount = onTimeCount + lateCount;

        report.DistanceVarianceKm = Math.Round(
            report.ActualTotalDistanceKm - report.PlannedTotalDistanceKm, 2);
        report.DistanceVariancePercent = report.PlannedTotalDistanceKm > 0
            ? Math.Round(report.DistanceVarianceKm / report.PlannedTotalDistanceKm * 100, 1)
            : 0;

        report.DurationVarianceMinutes = Math.Round(
            report.ActualTotalDurationMinutes - report.PlannedTotalDurationMinutes, 1);
        report.DurationVariancePercent = report.PlannedTotalDurationMinutes > 0
            ? Math.Round(report.DurationVarianceMinutes / report.PlannedTotalDurationMinutes * 100, 1)
            : 0;

        int totalWithData = onTimeCount + lateCount;
        report.OnTimeCount = onTimeCount;
        report.LateCount = lateCount;
        report.NoDataCount = noDataCount;
        report.OnTimeDeliveryRate = totalWithData > 0
            ? Math.Round((double)onTimeCount / totalWithData * 100, 1)
            : 0;
        report.AverageDelayMinutes = allDelays.Count > 0
            ? Math.Round(allDelays.Average(), 1)
            : 0;
        report.MaxDelayMinutes = allDelays.Count > 0
            ? Math.Round(allDelays.Max(), 1)
            : 0;

        return report;
    }

    /// <summary>
    /// Finds the first driver location that is within ~500m of the stop coordinates,
    /// indicating the driver arrived at the stop.
    /// </summary>
    private static DriverLocation? FindArrivalLocation(
        List<DriverLocation> locations, double stopLat, double stopLng)
    {
        const double thresholdKm = 0.5; // 500 meters

        foreach (var loc in locations)
        {
            var distance = HaversineDistanceKm(loc.Lat, loc.Lng, stopLat, stopLng);
            if (distance <= thresholdKm)
                return loc;
        }
        return null;
    }

    /// <summary>
    /// Calculates the actual distance traveled between two stops using GPS trail points.
    /// Sums up haversine distances between consecutive GPS points recorded between the stops.
    /// </summary>
    private static double CalculateGpsTrailDistance(
        Dictionary<Guid, List<DriverLocation>> locationsByShipment,
        RouteStop fromStop, RouteStop toStop)
    {
        // Try to use the destination stop's shipment GPS trail
        if (!toStop.ShipmentId.HasValue ||
            !locationsByShipment.TryGetValue(toStop.ShipmentId.Value, out var locations) ||
            locations.Count < 2)
        {
            // Fall back to straight-line distance
            return HaversineDistanceKm(fromStop.Lat, fromStop.Lng, toStop.Lat, toStop.Lng);
        }

        double totalDistance = 0;
        for (int i = 1; i < locations.Count; i++)
        {
            totalDistance += HaversineDistanceKm(
                locations[i - 1].Lat, locations[i - 1].Lng,
                locations[i].Lat, locations[i].Lng);
        }

        // If GPS trail distance seems unreasonably small, use straight-line
        var straightLine = HaversineDistanceKm(fromStop.Lat, fromStop.Lng, toStop.Lat, toStop.Lng);
        return totalDistance > straightLine * 0.5 ? totalDistance : straightLine;
    }

    /// <summary>
    /// Haversine formula for distance between two lat/lng points in kilometers.
    /// </summary>
    private static double HaversineDistanceKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371.0; // Earth radius in km
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}
