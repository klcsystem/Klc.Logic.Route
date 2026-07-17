using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.Insurance;

public class InsuranceService(
    IInsuranceRepository insuranceRepository,
    IRiskScoringService riskScoringService) : IInsuranceService
{
    public async Task<IEnumerable<InsuranceQuote>> RequestQuotesAsync(QuoteRequest request, Guid tenantId, string? userId)
    {
        var riskInput = new RiskInput
        {
            CargoValue = request.CargoValue,
            RouteDistanceKm = request.RouteDistanceKm,
            DriverScore = request.DriverScore,
            VehicleAgeYears = request.VehicleAgeYears,
            IsHazardous = request.IsHazardous,
            RequiresColdChain = request.RequiresColdChain
        };
        var risk = riskScoringService.CalculateRisk(riskInput);

        var partners = await insuranceRepository.GetActivePartnersAsync();
        var quotes = new List<InsuranceQuote>();

        foreach (var partner in partners)
        {
            var quote = new InsuranceQuote
            {
                TenantId = tenantId,
                ShipmentId = request.ShipmentId,
                PartnerId = partner.Id,
                CargoValue = request.CargoValue,
                RiskScore = risk.RiskScore,
                Currency = request.Currency,
                ValidUntil = DateTime.UtcNow.AddDays(7),
                CreatedBy = userId
            };

            if (partner.HasApi && !string.IsNullOrEmpty(partner.ApiEndpoint))
            {
                // For API partners: webhook would be sent here; mark as pending
                quote.Status = InsuranceQuoteStatus.Pending;
                // In production, send async webhook to partner.ApiEndpoint
            }
            else
            {
                // Non-API partners: create pending quote they'll see in broker panel
                quote.Status = InsuranceQuoteStatus.Pending;
            }

            await insuranceRepository.InsertQuoteAsync(quote);
            quotes.Add(quote);
        }

        return quotes;
    }

    public async Task<IEnumerable<InsuranceQuote>> GetQuotesAsync(Guid shipmentId, Guid tenantId)
    {
        return await insuranceRepository.GetQuotesByShipmentAsync(shipmentId, tenantId);
    }

    public async Task<InsurancePolicy> AcceptQuoteAsync(Guid quoteId, Guid tenantId, string? userId)
    {
        var quote = await insuranceRepository.GetQuoteByIdAsync(quoteId);
        if (quote == null)
            throw new InvalidOperationException("Teklif bulunamadı");
        if (quote.TenantId != tenantId)
            throw new InvalidOperationException("Bu teklif üzerinde yetkiniz yok");
        if (quote.Status != InsuranceQuoteStatus.Quoted)
            throw new InvalidOperationException("Teklif kabul edilebilir durumda değil");
        if (!quote.PremiumAmount.HasValue)
            throw new InvalidOperationException("Teklif fiyatı belirlenmemiş");

        // Update quote status
        quote.Status = InsuranceQuoteStatus.Accepted;
        await insuranceRepository.UpdateQuoteAsync(quote);

        // Create policy
        var policy = new InsurancePolicy
        {
            TenantId = tenantId,
            QuoteId = quoteId,
            ShipmentId = quote.ShipmentId,
            PartnerId = quote.PartnerId,
            PolicyNumber = $"POL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            PremiumPaid = quote.PremiumAmount.Value,
            CoverageAmount = quote.CargoValue,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddMonths(1),
            Status = InsurancePolicyStatus.Active,
            CreatedBy = userId
        };

        await insuranceRepository.InsertPolicyAsync(policy);
        return policy;
    }

    public async Task<IEnumerable<InsurancePolicy>> GetPoliciesAsync(Guid tenantId, int page, int pageSize)
    {
        return await insuranceRepository.GetPoliciesByTenantAsync(tenantId, page, pageSize);
    }

    public async Task<IEnumerable<InsuranceQuote>> GetPendingRequestsForPartnerAsync(string apiKey)
    {
        var partner = await insuranceRepository.GetPartnerByApiKeyAsync(apiKey);
        if (partner == null)
            throw new InvalidOperationException("Geçersiz API anahtarı");

        return await insuranceRepository.GetPendingQuotesByPartnerAsync(partner.Id);
    }

    public async Task<InsuranceQuote> SubmitPartnerQuoteAsync(PartnerQuoteSubmission submission)
    {
        var partner = await insuranceRepository.GetPartnerByApiKeyAsync(submission.ApiKey);
        if (partner == null)
            throw new InvalidOperationException("Geçersiz API anahtarı");

        var quote = await insuranceRepository.GetQuoteByIdAsync(submission.QuoteId);
        if (quote == null)
            throw new InvalidOperationException("Teklif bulunamadı");
        if (quote.PartnerId != partner.Id)
            throw new InvalidOperationException("Bu teklif size ait değil");
        if (quote.Status != InsuranceQuoteStatus.Pending)
            throw new InvalidOperationException("Teklif zaten yanıt verilmiş");

        quote.PremiumAmount = submission.PremiumAmount;
        quote.ValidUntil = submission.ValidUntil;
        quote.Status = InsuranceQuoteStatus.Quoted;
        quote.UpdatedAt = DateTime.UtcNow;

        await insuranceRepository.UpdateQuoteAsync(quote);
        return quote;
    }

    // ── Broker portalı: bireysel kullanıcı + hesap verebilirlik ──
    public async Task<BrokerLoginResult?> BrokerLoginAsync(string email, string password)
    {
        var user = await insuranceRepository.GetBrokerUserByEmailAsync(email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;
        var partner = await insuranceRepository.GetPartnerByIdAsync(user.PartnerId);
        await insuranceRepository.UpdateBrokerLastLoginAsync(user.Id);
        return new BrokerLoginResult { User = user, PartnerName = partner?.Name ?? "Broker" };
    }

    public Task<IEnumerable<BrokerQuoteView>> GetPartnerQuoteViewsAsync(Guid partnerId)
        => insuranceRepository.GetPartnerQuoteViewsAsync(partnerId);

    public Task<IEnumerable<InsurancePartner>> GetActivePartnersAsync()
        => insuranceRepository.GetActivePartnersAsync();

    public Task<IEnumerable<BrokerQuoteView>> GetTenantQuoteViewsAsync(Guid tenantId)
        => insuranceRepository.GetTenantQuoteViewsAsync(tenantId);

    public async Task<InsuranceQuote> SubmitQuoteByBrokerAsync(
        Guid partnerId, Guid brokerUserId, string brokerName, Guid quoteId, decimal premiumAmount, DateTime validUntil)
    {
        var quote = await insuranceRepository.GetQuoteByIdAsync(quoteId)
            ?? throw new InvalidOperationException("Teklif bulunamadı");
        if (quote.PartnerId != partnerId)
            throw new InvalidOperationException("Bu teklif size ait değil");
        if (quote.Status != InsuranceQuoteStatus.Pending)
            throw new InvalidOperationException("Teklif zaten yanıtlanmış");

        quote.PremiumAmount = premiumAmount;
        quote.ValidUntil = validUntil;
        quote.Status = InsuranceQuoteStatus.Quoted;
        quote.QuotedByUserId = brokerUserId;
        quote.QuotedByName = brokerName;
        quote.UpdatedAt = DateTime.UtcNow;
        await insuranceRepository.UpdateQuoteAsync(quote);
        return quote;
    }

    public async Task<InsuranceBrokerUser> CreateBrokerUserAsync(
        Guid partnerId, string fullName, string email, string password, Guid tenantId, string? createdBy)
    {
        if (await insuranceRepository.GetBrokerUserByEmailAsync(email) != null)
            throw new InvalidOperationException("Bu e-posta ile bir broker kullanıcısı zaten var");
        var user = new InsuranceBrokerUser
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PartnerId = partnerId,
            FullName = fullName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
        await insuranceRepository.InsertBrokerUserAsync(user);
        return user;
    }
}
