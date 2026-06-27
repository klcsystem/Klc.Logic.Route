using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class Driver : BaseEntity
{
    public Guid ProviderId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? LicenseNumber { get; set; }
    public DateTime? LicenseExpiry { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? UserId { get; set; }
    public string? DeviceToken { get; set; }

    // Skill & Workload Balancing
    public string? Skills { get; set; }           // Comma-separated: "ADR,Frigo,Heavy"
    public string? Certifications { get; set; }    // Comma-separated: "ADR,Frigo,Heavy"
    public decimal MaxWorkingHours { get; set; } = 10;
    public string? PreferredZones { get; set; }    // Comma-separated zone codes

    public List<string> GetCertificationList() =>
        string.IsNullOrWhiteSpace(Certifications)
            ? []
            : Certifications.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    public List<string> GetSkillList() =>
        string.IsNullOrWhiteSpace(Skills)
            ? []
            : Skills.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    public List<string> GetPreferredZoneList() =>
        string.IsNullOrWhiteSpace(PreferredZones)
            ? []
            : PreferredZones.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
}
