using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class InsuranceRepository(IPostgresConnectionFactory connectionFactory) : IInsuranceRepository
{
    // Partners
    public async Task<InsurancePartner?> GetPartnerByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<InsurancePartner>(
            "SELECT * FROM logistics.insurance_partners WHERE id = @Id AND is_deleted = FALSE",
            new { Id = id });
    }

    public async Task<IEnumerable<InsurancePartner>> GetActivePartnersAsync()
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<InsurancePartner>(
            "SELECT * FROM logistics.insurance_partners WHERE is_active = TRUE AND is_deleted = FALSE");
    }

    public async Task<InsurancePartner?> GetPartnerByApiKeyAsync(string apiKey)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<InsurancePartner>(
            "SELECT * FROM logistics.insurance_partners WHERE api_key = @ApiKey AND is_active = TRUE AND is_deleted = FALSE",
            new { ApiKey = apiKey });
    }

    // Quotes
    public async Task<InsuranceQuote?> GetQuoteByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<InsuranceQuote>(
            "SELECT * FROM logistics.insurance_quotes WHERE id = @Id AND is_deleted = FALSE",
            new { Id = id });
    }

    public async Task<IEnumerable<InsuranceQuote>> GetQuotesByShipmentAsync(Guid shipmentId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<InsuranceQuote>(
            @"SELECT * FROM logistics.insurance_quotes
              WHERE shipment_id = @ShipmentId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY created_at DESC",
            new { ShipmentId = shipmentId, TenantId = tenantId });
    }

    public async Task<IEnumerable<InsuranceQuote>> GetPendingQuotesByPartnerAsync(Guid partnerId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<InsuranceQuote>(
            @"SELECT * FROM logistics.insurance_quotes
              WHERE partner_id = @PartnerId AND status = 0 AND is_deleted = FALSE
              ORDER BY created_at DESC",
            new { PartnerId = partnerId });
    }

    public async Task<Guid> InsertQuoteAsync(InsuranceQuote q)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.insurance_quotes
              (id, tenant_id, shipment_id, partner_id, cargo_value, risk_score,
               premium_amount, currency, valid_until, status, created_by, created_at)
              VALUES (@Id, @TenantId, @ShipmentId, @PartnerId, @CargoValue, @RiskScore,
               @PremiumAmount, @Currency, @ValidUntil, @Status, @CreatedBy, @CreatedAt)",
            new
            {
                q.Id, q.TenantId, q.ShipmentId, q.PartnerId, q.CargoValue, q.RiskScore,
                q.PremiumAmount, q.Currency, q.ValidUntil, Status = (int)q.Status, q.CreatedBy, q.CreatedAt
            });
        return q.Id;
    }

    public async Task UpdateQuoteAsync(InsuranceQuote q)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.insurance_quotes SET
              premium_amount = @PremiumAmount, valid_until = @ValidUntil,
              status = @Status, updated_at = @Now
              WHERE id = @Id",
            new { q.Id, q.PremiumAmount, q.ValidUntil, Status = (int)q.Status, Now = DateTime.UtcNow });
    }

    // Policies
    public async Task<InsurancePolicy?> GetPolicyByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<InsurancePolicy>(
            "SELECT * FROM logistics.insurance_policies WHERE id = @Id AND is_deleted = FALSE",
            new { Id = id });
    }

    public async Task<IEnumerable<InsurancePolicy>> GetPoliciesByTenantAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<InsurancePolicy>(
            @"SELECT * FROM logistics.insurance_policies
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<Guid> InsertPolicyAsync(InsurancePolicy p)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.insurance_policies
              (id, tenant_id, quote_id, shipment_id, partner_id, policy_number,
               premium_paid, coverage_amount, start_date, end_date, status, created_by, created_at)
              VALUES (@Id, @TenantId, @QuoteId, @ShipmentId, @PartnerId, @PolicyNumber,
               @PremiumPaid, @CoverageAmount, @StartDate, @EndDate, @Status, @CreatedBy, @CreatedAt)",
            new
            {
                p.Id, p.TenantId, p.QuoteId, p.ShipmentId, p.PartnerId, p.PolicyNumber,
                p.PremiumPaid, p.CoverageAmount, p.StartDate, p.EndDate,
                Status = (int)p.Status, p.CreatedBy, p.CreatedAt
            });
        return p.Id;
    }

    public async Task UpdatePolicyStatusAsync(Guid id, int status)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.insurance_policies SET status = @Status, updated_at = @Now WHERE id = @Id",
            new { Id = id, Status = status, Now = DateTime.UtcNow });
    }
}
