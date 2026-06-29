using Klc.LogicRoute.Application.Geofencing;
using Klc.LogicRoute.Application.Tracking;
using Klc.LogicRoute.Application.Tracking.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using MediatR;

namespace Klc.LogicRoute.Application.Mobile.Commands;

public record UpdateDriverLocationCommand(
    Guid DriverId,
    Guid TenantId,
    List<LocationPoint> Points) : IRequest<UpdateDriverLocationResult>;

public record LocationPoint(
    Guid? ShipmentId,
    double Lat,
    double Lng,
    double? Speed,
    double? Heading,
    double? Accuracy,
    DateTime? RecordedAt);

public record UpdateDriverLocationResult(
    bool Success,
    int SavedCount,
    IReadOnlyList<GeofenceEvent> GeofenceEvents,
    DeviationAlert? DeviationAlert = null);

public class UpdateDriverLocationHandler(
    IDriverLocationRepository driverLocationRepository,
    IGeofenceService geofenceService,
    IRouteDeviationService routeDeviationService) : IRequestHandler<UpdateDriverLocationCommand, UpdateDriverLocationResult>
{
    public async Task<UpdateDriverLocationResult> Handle(UpdateDriverLocationCommand request, CancellationToken cancellationToken)
    {
        var locations = request.Points.Select(p => new DriverLocation
        {
            TenantId = request.TenantId,
            DriverId = request.DriverId,
            ShipmentId = p.ShipmentId,
            Lat = p.Lat,
            Lng = p.Lng,
            Speed = p.Speed,
            Heading = p.Heading,
            Accuracy = p.Accuracy,
            RecordedAt = p.RecordedAt ?? DateTime.UtcNow
        }).ToList();

        await driverLocationRepository.CreateBatchAsync(locations);

        // Check geofences and route deviation for the latest location point
        var allGeofenceEvents = new List<GeofenceEvent>();
        DeviationAlert? deviationAlert = null;

        if (request.Points.Count > 0)
        {
            var latest = request.Points.Last();

            // Geofence check
            var events = await geofenceService.CheckLocationAsync(
                request.DriverId,
                request.TenantId,
                latest.Lat,
                latest.Lng,
                latest.ShipmentId);
            allGeofenceEvents.AddRange(events);

            // Route deviation check
            deviationAlert = await routeDeviationService.CheckDeviationAsync(
                request.DriverId,
                request.TenantId,
                latest.Lat,
                latest.Lng,
                latest.ShipmentId);
        }

        return new UpdateDriverLocationResult(true, locations.Count, allGeofenceEvents, deviationAlert);
    }
}
