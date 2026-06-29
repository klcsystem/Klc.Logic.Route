using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class CapacityMatch : BaseEntity
{
    public Guid ListingId { get; set; }
    public Guid RequestingTenantId { get; set; }
    public decimal RequestedWeightKg { get; set; }
    public CapacityMatchStatus MatchStatus { get; set; } = CapacityMatchStatus.Pending;
    public decimal? AgreedPrice { get; set; }
}

public enum CapacityMatchStatus
{
    Pending = 0,
    Accepted = 1,
    Rejected = 2
}
