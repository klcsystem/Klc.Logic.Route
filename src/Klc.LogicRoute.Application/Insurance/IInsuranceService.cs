using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Application.Insurance;

public interface IInsuranceService
{
    Task<IEnumerable<InsuranceQuote>> RequestQuotesAsync(QuoteRequest request, Guid tenantId, string? userId);
    Task<IEnumerable<InsuranceQuote>> GetQuotesAsync(Guid shipmentId, Guid tenantId);
    Task<InsurancePolicy> AcceptQuoteAsync(Guid quoteId, Guid tenantId, string? userId);
    Task<IEnumerable<InsurancePolicy>> GetPoliciesAsync(Guid tenantId, int page, int pageSize);
    Task<IEnumerable<InsuranceQuote>> GetPendingRequestsForPartnerAsync(string apiKey);
    Task<InsuranceQuote> SubmitPartnerQuoteAsync(PartnerQuoteSubmission submission);

    // Broker portalı — bireysel, hesap verebilir kullanıcılar
    Task<BrokerLoginResult?> BrokerLoginAsync(string email, string password);
    Task<IEnumerable<BrokerQuoteView>> GetPartnerQuoteViewsAsync(Guid partnerId);
    Task<InsuranceQuote> SubmitQuoteByBrokerAsync(Guid partnerId, Guid brokerUserId, string brokerName, Guid quoteId, decimal premiumAmount, DateTime validUntil);
    Task<InsuranceBrokerUser> CreateBrokerUserAsync(Guid partnerId, string fullName, string email, string password, Guid tenantId, string? createdBy);
}

public class BrokerLoginResult
{
    public InsuranceBrokerUser User { get; set; } = null!;
    public string PartnerName { get; set; } = string.Empty;
}

public class QuoteRequest
{
    public Guid ShipmentId { get; set; }
    public decimal CargoValue { get; set; }
    public decimal RouteDistanceKm { get; set; }
    public decimal DriverScore { get; set; }
    public int VehicleAgeYears { get; set; }
    public bool IsHazardous { get; set; }
    public bool RequiresColdChain { get; set; }
    public string Currency { get; set; } = "TRY";
}

public class PartnerQuoteSubmission
{
    public string ApiKey { get; set; } = string.Empty;
    public Guid QuoteId { get; set; }
    public decimal PremiumAmount { get; set; }
    public DateTime ValidUntil { get; set; }
}
