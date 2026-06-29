using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class InsuranceQuote : BaseEntity
{
    public Guid ShipmentId { get; set; }
    public Guid PartnerId { get; set; }
    public decimal CargoValue { get; set; }
    public decimal RiskScore { get; set; }
    public decimal? PremiumAmount { get; set; }
    public string Currency { get; set; } = "TRY";
    public DateTime? ValidUntil { get; set; }
    public InsuranceQuoteStatus Status { get; set; } = InsuranceQuoteStatus.Pending;
}

public enum InsuranceQuoteStatus
{
    Pending = 0,
    Quoted = 1,
    Accepted = 2,
    Expired = 3,
    Rejected = 4
}
