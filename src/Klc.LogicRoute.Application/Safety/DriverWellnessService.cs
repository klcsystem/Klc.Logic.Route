using Klc.LogicRoute.Application.Safety.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Safety;

public class DriverWellnessService : IDriverWellnessService
{
    private readonly IDriverRepository _driverRepository;
    private readonly IDriverLocationRepository _driverLocationRepository;
    private readonly ILogger<DriverWellnessService> _logger;

    // Turkish labor law constants
    private const double MaxDailyHours = 11.0;
    private const double MandatoryBreakAfterHours = 4.5;
    private const double MandatoryBreakMinutes = 45.0;
    private const double BreakDetectionGapMinutes = 15.0; // Gap in location updates indicating a break

    public DriverWellnessService(
        IDriverRepository driverRepository,
        IDriverLocationRepository driverLocationRepository,
        ILogger<DriverWellnessService> logger)
    {
        _driverRepository = driverRepository;
        _driverLocationRepository = driverLocationRepository;
        _logger = logger;
    }

    public async Task<WellnessReport> GetWellnessAsync(Guid driverId, Guid tenantId)
    {
        var driver = await _driverRepository.GetByIdAsync(driverId);
        if (driver is null)
            throw new InvalidOperationException($"Driver {driverId} not found.");

        // Get today's location updates for this driver
        var latestLocation = await _driverLocationRepository.GetLatestByDriverAsync(driverId, tenantId);

        // We use the latest location to determine activity, but for a full day analysis
        // we need all locations. Since the repository only gives latest/by-shipment,
        // we approximate based on available data.
        var report = new WellnessReport
        {
            DriverId = driverId,
            DriverName = driver.FullName,
            CalculatedAt = DateTime.UtcNow
        };

        if (latestLocation is null)
        {
            // No location data — driver not active today
            report.SafetyScore = 100;
            report.FatigueLevel = FatigueRiskLevel.OK;
            report.HoursWorked = 0;
            report.Recommendations.Add("Surucu bugun aktif degil");
            return report;
        }

        // Calculate hours worked based on location timestamps
        var now = DateTime.UtcNow;
        var firstActivityTime = latestLocation.CreatedAt.Date.AddHours(7); // Assume shift start at 07:00 if no better data
        var hoursWorked = (now - firstActivityTime).TotalHours;

        // If latest location is old (>2 hours ago), assume driver stopped
        var hoursSinceLastUpdate = (now - latestLocation.RecordedAt).TotalHours;
        if (hoursSinceLastUpdate > 2)
        {
            hoursWorked = (latestLocation.RecordedAt - firstActivityTime).TotalHours;
        }

        hoursWorked = Math.Max(0, Math.Min(hoursWorked, 24));

        // Estimate breaks (gaps in location updates > BreakDetectionGapMinutes)
        // With limited repository access, we estimate based on hours worked
        var estimatedBreaks = (int)(hoursWorked / MandatoryBreakAfterHours);
        var totalBreakMinutes = estimatedBreaks * MandatoryBreakMinutes;
        var hoursSinceLastBreak = hoursWorked > MandatoryBreakAfterHours
            ? hoursWorked % MandatoryBreakAfterHours
            : hoursWorked;

        // Location update frequency
        var locationUpdateFrequency = hoursSinceLastUpdate > 0 ? hoursSinceLastUpdate * 60 : 5; // minutes

        report.HoursWorked = Math.Round(hoursWorked, 1);
        report.HoursSinceLastBreak = Math.Round(hoursSinceLastBreak, 1);
        report.BreaksTaken = estimatedBreaks;
        report.TotalBreakMinutes = totalBreakMinutes;
        report.LocationUpdateCount = 1; // We only have the latest
        report.LocationUpdateFrequencyMinutes = Math.Round(locationUpdateFrequency, 1);

        // Determine fatigue level
        report.FatigueLevel = hoursWorked switch
        {
            > MaxDailyHours => FatigueRiskLevel.Blocked,
            > 10 => FatigueRiskLevel.Critical,
            > 8 => FatigueRiskLevel.Warning,
            _ => FatigueRiskLevel.OK
        };
        report.IsBlocked = report.FatigueLevel == FatigueRiskLevel.Blocked;

        // Calculate safety score (0-100, higher is safer)
        report.SafetyScore = CalculateSafetyScore(hoursWorked, estimatedBreaks, hoursSinceLastBreak, locationUpdateFrequency);

        // Generate alerts and recommendations
        if (hoursWorked > MaxDailyHours)
        {
            report.Alerts.Add($"BLOKE: Gunluk calisma suresi asimi ({hoursWorked:F1}h / max {MaxDailyHours}h)");
            report.Recommendations.Add("Surucu derhal dinlenmeye alinmali — yasal limit asildi");
        }
        else if (hoursWorked > 10)
        {
            report.Alerts.Add($"KRITIK: Calisma suresi {hoursWorked:F1} saat — limit yaklastiriyor");
            report.Recommendations.Add("Kalan teslimatlar baska surucuye devredilmeli");
        }
        else if (hoursWorked > 8)
        {
            report.Alerts.Add($"UYARI: Calisma suresi {hoursWorked:F1} saat");
            report.Recommendations.Add("Mola planlamasi yapilmali, kalan teslimat sayisi kontrol edilmeli");
        }

        if (hoursSinceLastBreak > MandatoryBreakAfterHours)
        {
            report.Alerts.Add($"Son moladan bu yana {hoursSinceLastBreak:F1} saat gecti (max {MandatoryBreakAfterHours}h)");
            report.Recommendations.Add($"En az {MandatoryBreakMinutes} dakika mola verilmeli");
        }

        if (locationUpdateFrequency > 30)
        {
            report.Alerts.Add("Konum guncellemesi seyrek — cihaz veya baglanti sorunu olabilir");
            report.Recommendations.Add("Surucu cihazi kontrol edilmeli");
        }

        _logger.LogInformation(
            "Wellness report for driver {DriverId} ({DriverName}): score={Score}, fatigue={Level}, hours={Hours}",
            driverId, driver.FullName, report.SafetyScore, report.FatigueLevel, hoursWorked);

        return report;
    }

    public async Task<List<SafetyAlert>> GetActiveAlertsAsync(Guid tenantId)
    {
        var drivers = await _driverRepository.GetAllAsync(tenantId);
        var activeDrivers = drivers.Where(d => d.IsActive).ToList();
        var alerts = new List<SafetyAlert>();

        foreach (var driver in activeDrivers)
        {
            try
            {
                var report = await GetWellnessAsync(driver.Id, tenantId);
                if (report.FatigueLevel >= FatigueRiskLevel.Warning)
                {
                    alerts.Add(new SafetyAlert
                    {
                        DriverId = driver.Id,
                        DriverName = driver.FullName,
                        FatigueLevel = report.FatigueLevel,
                        HoursWorked = report.HoursWorked,
                        SafetyScore = report.SafetyScore,
                        AlertMessage = report.Alerts.FirstOrDefault() ?? $"Yorgunluk seviyesi: {report.FatigueLevel}"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get wellness for driver {DriverId}", driver.Id);
            }
        }

        return alerts.OrderByDescending(a => a.FatigueLevel).ThenBy(a => a.SafetyScore).ToList();
    }

    public async Task<SafetyDashboard> GetDashboardAsync(Guid tenantId)
    {
        var drivers = await _driverRepository.GetAllAsync(tenantId);
        var activeDrivers = drivers.Where(d => d.IsActive).ToList();

        var reports = new List<WellnessReport>();
        var alerts = new List<SafetyAlert>();

        foreach (var driver in activeDrivers)
        {
            try
            {
                var report = await GetWellnessAsync(driver.Id, tenantId);
                reports.Add(report);

                if (report.FatigueLevel >= FatigueRiskLevel.Warning)
                {
                    alerts.Add(new SafetyAlert
                    {
                        DriverId = driver.Id,
                        DriverName = driver.FullName,
                        FatigueLevel = report.FatigueLevel,
                        HoursWorked = report.HoursWorked,
                        SafetyScore = report.SafetyScore,
                        AlertMessage = report.Alerts.FirstOrDefault() ?? $"Yorgunluk seviyesi: {report.FatigueLevel}"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get wellness for driver {DriverId}", driver.Id);
            }
        }

        return new SafetyDashboard
        {
            TotalActiveDrivers = activeDrivers.Count,
            DriversOk = reports.Count(r => r.FatigueLevel == FatigueRiskLevel.OK),
            DriversWarning = reports.Count(r => r.FatigueLevel == FatigueRiskLevel.Warning),
            DriversCritical = reports.Count(r => r.FatigueLevel == FatigueRiskLevel.Critical),
            DriversBlocked = reports.Count(r => r.FatigueLevel == FatigueRiskLevel.Blocked),
            FleetAverageSafetyScore = reports.Count > 0 ? Math.Round(reports.Average(r => r.SafetyScore), 1) : 100,
            FleetAverageHoursWorked = reports.Count > 0 ? Math.Round(reports.Average(r => r.HoursWorked), 1) : 0,
            ActiveAlerts = alerts.OrderByDescending(a => a.FatigueLevel).ThenBy(a => a.SafetyScore).ToList()
        };
    }

    private static int CalculateSafetyScore(double hoursWorked, int breaksTaken, double hoursSinceLastBreak, double updateFrequencyMinutes)
    {
        var score = 100.0;

        // Hours worked penalty
        if (hoursWorked > MaxDailyHours)
            score -= 50;
        else if (hoursWorked > 10)
            score -= 35;
        else if (hoursWorked > 8)
            score -= 15;
        else if (hoursWorked > 6)
            score -= 5;

        // Break compliance
        var expectedBreaks = (int)(hoursWorked / MandatoryBreakAfterHours);
        if (breaksTaken < expectedBreaks)
            score -= (expectedBreaks - breaksTaken) * 10;

        // Hours since last break penalty
        if (hoursSinceLastBreak > MandatoryBreakAfterHours)
            score -= 20;
        else if (hoursSinceLastBreak > 3.5)
            score -= 10;

        // Location update frequency penalty
        if (updateFrequencyMinutes > 60)
            score -= 15;
        else if (updateFrequencyMinutes > 30)
            score -= 10;
        else if (updateFrequencyMinutes > 15)
            score -= 5;

        return (int)Math.Clamp(score, 0, 100);
    }
}
