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
}
