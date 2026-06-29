namespace Klc.LogicRoute.Application.Safety.Models;

public class WellnessReport
{
    public Guid DriverId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public int SafetyScore { get; set; }
    public FatigueRiskLevel FatigueLevel { get; set; }
    public double HoursWorked { get; set; }
    public double HoursSinceLastBreak { get; set; }
    public int BreaksTaken { get; set; }
    public double TotalBreakMinutes { get; set; }
    public int LocationUpdateCount { get; set; }
    public double LocationUpdateFrequencyMinutes { get; set; }
    public List<string> Alerts { get; set; } = [];
    public List<string> Recommendations { get; set; } = [];
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public bool IsBlocked { get; set; }
}

public enum FatigueRiskLevel
{
    OK = 0,
    Warning = 1,
    Critical = 2,
    Blocked = 3
}

public class SafetyAlert
{
    public Guid DriverId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public FatigueRiskLevel FatigueLevel { get; set; }
    public double HoursWorked { get; set; }
    public int SafetyScore { get; set; }
    public string AlertMessage { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class SafetyDashboard
{
    public int TotalActiveDrivers { get; set; }
    public int DriversOk { get; set; }
    public int DriversWarning { get; set; }
    public int DriversCritical { get; set; }
    public int DriversBlocked { get; set; }
    public double FleetAverageSafetyScore { get; set; }
    public double FleetAverageHoursWorked { get; set; }
    public List<SafetyAlert> ActiveAlerts { get; set; } = [];
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
