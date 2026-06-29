namespace Klc.LogicRoute.Application.Tracking.Models;

public record DeviationAlert(
    Guid DriverId,
    Guid ShipmentId,
    Guid TenantId,
    double DriverLat,
    double DriverLng,
    double NearestRouteLat,
    double NearestRouteLng,
    double DeviationMeters,
    DateTime DetectedAt);
