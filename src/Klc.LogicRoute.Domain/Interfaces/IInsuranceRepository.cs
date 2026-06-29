using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IInsuranceRepository
{
    // Partners
    Task<InsurancePartner?> GetPartnerByIdAsync(Guid id);
    Task<IEnumerable<InsurancePartner>> GetActivePartnersAsync();
    Task<InsurancePartner?> GetPartnerByApiKeyAsync(string apiKey);

    // Quotes
    Task<InsuranceQuote?> GetQuoteByIdAsync(Guid id);
    Task<IEnumerable<InsuranceQuote>> GetQuotesByShipmentAsync(Guid shipmentId, Guid tenantId);
    Task<IEnumerable<InsuranceQuote>> GetPendingQuotesByPartnerAsync(Guid partnerId);
    Task<Guid> InsertQuoteAsync(InsuranceQuote quote);
    Task UpdateQuoteAsync(InsuranceQuote quote);

    // Policies
    Task<InsurancePolicy?> GetPolicyByIdAsync(Guid id);
    Task<IEnumerable<InsurancePolicy>> GetPoliciesByTenantAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<Guid> InsertPolicyAsync(InsurancePolicy policy);
    Task UpdatePolicyStatusAsync(Guid id, int status);
}
