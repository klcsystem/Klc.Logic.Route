using Klc.LogicRoute.Application.RouteOptimization.Models;

namespace Klc.LogicRoute.Application.RouteOptimization.Services;

public interface ITruckRoutingService
{
    /// <summary>
    /// Builds an OSRM request URL with truck-specific constraint parameters.
    /// </summary>
    string BuildOsrmRouteUrl(string baseUrl, IEnumerable<(double Lat, double Lng)> waypoints, VehicleConstraints? constraints);

    /// <summary>
    /// Validates whether a vehicle can carry the given shipment based on constraints.
    /// </summary>
    bool CanCarryShipment(VrpVehicle vehicle, VrpStop stop, bool isHazardous, bool requiresColdChain);

    /// <summary>
    /// Filters vehicles that are compatible with a set of stops based on constraints.
    /// </summary>
    IEnumerable<VrpVehicle> FilterCompatibleVehicles(IEnumerable<VrpVehicle> vehicles, IEnumerable<(VrpStop Stop, bool IsHazardous, bool RequiresColdChain)> stops);
}

public class TruckRoutingService : ITruckRoutingService
{
    public string BuildOsrmRouteUrl(
        string baseUrl,
        IEnumerable<(double Lat, double Lng)> waypoints,
        VehicleConstraints? constraints)
    {
        var coords = string.Join(";", waypoints.Select(w => $"{w.Lng},{w.Lat}"));
        var url = $"{baseUrl.TrimEnd('/')}/route/v1/driving/{coords}?overview=full&steps=true";

        if (constraints == null)
            return url;

        var routingParams = constraints.ToRoutingParameters();
        foreach (var (key, value) in routingParams)
        {
            url += $"&{key}={value}";
        }

        return url;
    }

    public bool CanCarryShipment(VrpVehicle vehicle, VrpStop stop, bool isHazardous, bool requiresColdChain)
    {
        var constraints = vehicle.Constraints;
        if (constraints == null)
            return true;

        // Hazmat check: shipment requires ADR but vehicle is not certified
        if (isHazardous && !constraints.IsHazmat)
            return false;

        // Cold chain check: shipment requires refrigeration but vehicle is not frigorifik
        if (requiresColdChain && !constraints.IsFrigorifik)
            return false;

        // Weight/volume checks are handled by VRP solver capacity constraints
        return true;
    }

    public IEnumerable<VrpVehicle> FilterCompatibleVehicles(
        IEnumerable<VrpVehicle> vehicles,
        IEnumerable<(VrpStop Stop, bool IsHazardous, bool RequiresColdChain)> stops)
    {
        var stopList = stops.ToList();
        var needsHazmat = stopList.Any(s => s.IsHazardous);
        var needsColdChain = stopList.Any(s => s.RequiresColdChain);

        return vehicles.Where(v =>
        {
            var c = v.Constraints;
            if (c == null)
                return !needsHazmat && !needsColdChain;

            if (needsHazmat && !c.IsHazmat)
                return false;
            if (needsColdChain && !c.IsFrigorifik)
                return false;

            return true;
        });
    }
}
