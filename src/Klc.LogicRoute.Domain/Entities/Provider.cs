using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class Provider : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public ProviderType Type { get; set; } = ProviderType.DirectCarrier;
    public string? ApiBaseUrl { get; set; }
    public string? ApiKey { get; set; }
    public string? ApiSecret { get; set; }
    public bool IsActive { get; set; } = true;
    public IntegrationMode IntegrationMode { get; set; } = IntegrationMode.Managed;
    public bool IsGlobal { get; set; }
    public string? SupportedVehicleTypes { get; set; }
    public string? ServiceRegions { get; set; }
    public string? TaxNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ContactPerson { get; set; }

    public List<Contract> Contracts { get; set; } = [];
}
