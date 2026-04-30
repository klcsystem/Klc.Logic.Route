using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class Vehicle : BaseEntity
{
    public Guid ProviderId { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public VehicleCategory VehicleType { get; set; }
    public string? BodyType { get; set; }
    public decimal? Tonnage { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? InsuranceExpiry { get; set; }
    public string? CurrentDriverId { get; set; }
    public string? Note { get; set; }
}
