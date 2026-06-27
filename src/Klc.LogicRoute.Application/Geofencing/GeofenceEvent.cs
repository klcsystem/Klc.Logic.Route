using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Application.Geofencing;

public record GeofenceEvent(
    Guid DriverId,
    Guid ShipmentId,
    Guid TenantId,
    GeofenceEventType EventType,
    double DriverLat,
    double DriverLng,
    double DestinationLat,
    double DestinationLng,
    double DistanceMeters,
    DateTime OccurredAt);
