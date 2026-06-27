using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Application.DriverSkillMatching;

public interface IDriverSkillMatcher
{
    /// <summary>
    /// Matches drivers to stops based on required certifications (ADR, Frigo, Heavy).
    /// Returns a dictionary mapping each stop to the list of eligible drivers.
    /// </summary>
    DriverMatchResult MatchDriversToStops(List<DriverStopRequirement> stops, List<Driver> drivers);

    /// <summary>
    /// Gets eligible drivers for a single shipment based on its flags.
    /// </summary>
    List<Driver> GetEligibleDrivers(bool isHazardous, bool requiresColdChain, bool isHeavy, List<Driver> drivers);
}

public class DriverSkillMatcher : IDriverSkillMatcher
{
    public DriverMatchResult MatchDriversToStops(List<DriverStopRequirement> stops, List<Driver> drivers)
    {
        var result = new DriverMatchResult();

        foreach (var stop in stops)
        {
            var requiredCerts = GetRequiredCertifications(stop.IsHazardous, stop.RequiresColdChain, stop.IsHeavy);
            var eligible = drivers.Where(d => d.IsActive && HasAllCertifications(d, requiredCerts)).ToList();

            result.StopMatches.Add(new StopDriverMatch
            {
                StopId = stop.StopId,
                RequiredCertifications = requiredCerts,
                EligibleDrivers = eligible,
                HasMatch = eligible.Count > 0
            });

            if (eligible.Count == 0)
                result.UnmatchedStops.Add(stop.StopId);
        }

        result.AllMatched = result.UnmatchedStops.Count == 0;
        return result;
    }

    public List<Driver> GetEligibleDrivers(bool isHazardous, bool requiresColdChain, bool isHeavy, List<Driver> drivers)
    {
        var requiredCerts = GetRequiredCertifications(isHazardous, requiresColdChain, isHeavy);
        return drivers.Where(d => d.IsActive && HasAllCertifications(d, requiredCerts)).ToList();
    }

    private static List<string> GetRequiredCertifications(bool isHazardous, bool requiresColdChain, bool isHeavy)
    {
        var certs = new List<string>();
        if (isHazardous) certs.Add("ADR");
        if (requiresColdChain) certs.Add("Frigo");
        if (isHeavy) certs.Add("Heavy");
        return certs;
    }

    private static bool HasAllCertifications(Driver driver, List<string> requiredCerts)
    {
        if (requiredCerts.Count == 0) return true;
        var driverCerts = driver.GetCertificationList();
        return requiredCerts.All(rc => driverCerts.Contains(rc, StringComparer.OrdinalIgnoreCase));
    }
}

public class DriverStopRequirement
{
    public Guid StopId { get; set; }
    public bool IsHazardous { get; set; }
    public bool RequiresColdChain { get; set; }
    public bool IsHeavy { get; set; }
}

public class DriverMatchResult
{
    public List<StopDriverMatch> StopMatches { get; set; } = [];
    public List<Guid> UnmatchedStops { get; set; } = [];
    public bool AllMatched { get; set; }
}

public class StopDriverMatch
{
    public Guid StopId { get; set; }
    public List<string> RequiredCertifications { get; set; } = [];
    public List<Driver> EligibleDrivers { get; set; } = [];
    public bool HasMatch { get; set; }
}
