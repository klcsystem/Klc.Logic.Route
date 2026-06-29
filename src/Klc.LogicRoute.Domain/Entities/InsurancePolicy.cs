using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class InsurancePolicy : BaseEntity
{
    public Guid QuoteId { get; set; }
    public Guid ShipmentId { get; set; }
    public Guid PartnerId { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public decimal PremiumPaid { get; set; }
    public decimal CoverageAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public InsurancePolicyStatus Status { get; set; } = InsurancePolicyStatus.Active;
}

public enum InsurancePolicyStatus
{
    Active = 0,
    Claimed = 1,
    Expired = 2,
    Cancelled = 3
}
