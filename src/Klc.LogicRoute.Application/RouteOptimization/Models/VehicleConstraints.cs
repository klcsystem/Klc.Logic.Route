namespace Klc.LogicRoute.Application.RouteOptimization.Models;

/// <summary>
/// Truck-specific routing constraints for VRP solver.
/// Covers physical dimensions, hazmat/cold-chain certification, and road avoidance preferences.
/// </summary>
public record VehicleConstraints
{
    /// <summary>Maximum vehicle height in meters (tunnel/bridge restrictions).</summary>
    public double? MaxHeight { get; init; }

    /// <summary>Maximum vehicle width in meters.</summary>
    public double? MaxWidth { get; init; }

    /// <summary>Maximum vehicle length in meters.</summary>
    public double? MaxLength { get; init; }

    /// <summary>Maximum axle weight in tonnes.</summary>
    public double? MaxAxleWeight { get; init; }

    /// <summary>Whether the vehicle has ADR (hazmat) certification.</summary>
    public bool IsHazmat { get; init; }

    /// <summary>Whether the vehicle is refrigerated (frigorifik).</summary>
    public bool IsFrigorifik { get; init; }

    /// <summary>Avoid toll roads when routing.</summary>
    public bool AvoidTollRoads { get; init; }

    /// <summary>Avoid ferries when routing.</summary>
    public bool AvoidFerries { get; init; }

    /// <summary>
    /// Builds OSRM-compatible exclude parameter string for routing requests.
    /// </summary>
    public string? ToOsrmExclude()
    {
        var excludes = new List<string>();
        if (AvoidTollRoads) excludes.Add("toll");
        if (AvoidFerries) excludes.Add("ferry");
        return excludes.Count > 0 ? string.Join(",", excludes) : null;
    }

    /// <summary>
    /// Builds query parameters for OSRM/Valhalla routing requests.
    /// </summary>
    public Dictionary<string, string> ToRoutingParameters()
    {
        var parameters = new Dictionary<string, string>();

        var exclude = ToOsrmExclude();
        if (exclude != null)
            parameters["exclude"] = exclude;

        if (MaxHeight.HasValue)
            parameters["height"] = MaxHeight.Value.ToString("F1");

        if (MaxWidth.HasValue)
            parameters["width"] = MaxWidth.Value.ToString("F1");

        if (MaxLength.HasValue)
            parameters["length"] = MaxLength.Value.ToString("F1");

        if (MaxAxleWeight.HasValue)
            parameters["axle_weight"] = MaxAxleWeight.Value.ToString("F1");

        return parameters;
    }
}
