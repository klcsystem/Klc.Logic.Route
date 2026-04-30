using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class RoutingRule : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; } = true;
    public string? OriginRegion { get; set; }
    public string? DestinationRegion { get; set; }
    public VehicleCategory? VehicleCategory { get; set; }
    public decimal? MinWeightKg { get; set; }
    public decimal? MaxWeightKg { get; set; }
    public bool? IsHazardous { get; set; }
    public bool? RequiresColdChain { get; set; }
    public Guid? PreferredProviderId { get; set; }
    public Guid? PreferredContractId { get; set; }
    public string? Action { get; set; }
    public string? Notes { get; set; }
}
