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
              status = @Status, quoted_by_user_id = @QuotedByUserId, quoted_by_name = @QuotedByName,
              updated_at = @Now
              WHERE id = @Id",
            new { q.Id, q.PremiumAmount, q.ValidUntil, Status = (int)q.Status, q.QuotedByUserId, q.QuotedByName, Now = DateTime.UtcNow });
    }

    // ── Broker kullanıcıları ──
    public async Task<InsuranceBrokerUser?> GetBrokerUserByEmailAsync(string email)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<InsuranceBrokerUser>(
            "SELECT * FROM logistics.insurance_broker_users WHERE LOWER(email) = LOWER(@Email) AND is_active = TRUE AND is_deleted = FALSE",
            new { Email = email });
    }

    public async Task<InsuranceBrokerUser?> GetBrokerUserByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<InsuranceBrokerUser>(
            "SELECT * FROM logistics.insurance_broker_users WHERE id = @Id AND is_deleted = FALSE",
            new { Id = id });
    }

    public async Task<Guid> InsertBrokerUserAsync(InsuranceBrokerUser u)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.insurance_broker_users
              (id, tenant_id, partner_id, full_name, email, password_hash, is_active, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @PartnerId, @FullName, @Email, @PasswordHash, @IsActive, FALSE, @CreatedAt, @CreatedBy)",
            u);
        return u.Id;
    }

    public async Task UpdateBrokerLastLoginAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.insurance_broker_users SET last_login_at = @Now WHERE id = @Id",
            new { Id = id, Now = DateTime.UtcNow });
    }

    public async Task<IEnumerable<BrokerQuoteView>> GetPartnerQuoteViewsAsync(Guid partnerId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        // Sevkiyat detaylarini (rota, kargo) teklife ekle; sevkiyat yoksa alanlar null kalir.
        return await conn.QueryAsync<BrokerQuoteView>(QuoteViewSelect + " WHERE q.partner_id = @PartnerId AND q.is_deleted = FALSE ORDER BY q.created_at DESC",
            new { PartnerId = partnerId });
    }

    public async Task<IEnumerable<BrokerQuoteView>> GetTenantQuoteViewsAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<BrokerQuoteView>(QuoteViewSelect + " WHERE q.tenant_id = @TenantId AND q.is_deleted = FALSE ORDER BY q.created_at DESC",
            new { TenantId = tenantId });
    }

    // Teklif + sevkiyat + partner JOIN (broker ve nakliyeci gorunumleri icin ortak)
    private const string QuoteViewSelect =
        @"SELECT q.id AS Id, q.shipment_id AS ShipmentId, q.partner_id AS PartnerId, p.name AS PartnerName,
                 s.shipment_number AS ShipmentNumber,
                 q.cargo_value AS CargoValue, q.risk_score AS RiskScore, q.premium_amount AS PremiumAmount,
                 q.currency AS Currency, q.status AS Status, q.valid_until AS ValidUntil,
                 q.quoted_by_name AS QuotedByName, q.created_at AS CreatedAt,
                 s.origin_city AS OriginCity, s.destination_city AS DestinationCity,
                 s.origin_address AS OriginAddress, s.destination_address AS DestinationAddress,
                 s.total_weight_kg AS WeightKg, s.total_volume_m3 AS VolumeM3,
                 COALESCE(s.is_hazardous, FALSE) AS IsHazardous, COALESCE(s.requires_cold_chain, FALSE) AS RequiresColdChain
          FROM logistics.insurance_quotes q
          LEFT JOIN logistics.shipments s ON s.id = q.shipment_id
          LEFT JOIN logistics.insurance_partners p ON p.id = q.partner_id";

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
