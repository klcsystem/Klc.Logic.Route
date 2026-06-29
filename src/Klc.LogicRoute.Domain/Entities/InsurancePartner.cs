using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class InsurancePartner : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ApiEndpoint { get; set; }
    public string? ApiKey { get; set; }
    public bool HasApi { get; set; }
    public string? ContactEmail { get; set; }
    public decimal CommissionPercent { get; set; }
    public bool IsActive { get; set; } = true;
}
