namespace Klc.LogicRoute.Application.Geofencing;

public interface IGeofenceService
{
    /// <summary>
    /// Checks all location points for a driver against active shipment geofences.
    /// Returns any geofence events (ARRIVED/DEPARTED) triggered by the location updates.
    /// </summary>
    Task<IReadOnlyList<GeofenceEvent>> CheckLocationAsync(
        Guid driverId,
        Guid tenantId,
        double lat,
        double lng,
        Guid? shipmentId);

    /// <summary>
    /// Returns the configured geofence radius in meters.
    /// </summary>
    double GetRadiusMeters();
}
