using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class InvoiceAuditRepository(IPostgresConnectionFactory connectionFactory) : IInvoiceAuditRepository
{
    public async Task<IEnumerable<InvoiceAudit>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<InvoiceAudit>(
            "SELECT * FROM logistics.invoice_audits WHERE tenant_id = @TenantId ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<InvoiceAudit?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<InvoiceAudit>(
            "SELECT * FROM logistics.invoice_audits WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(InvoiceAudit audit)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.invoice_audits (id, tenant_id, shipment_id, provider_id, contract_id, contract_rate_id,
              invoice_number, invoice_amount, expected_amount, difference, difference_percent,
              currency, status, audit_notes, created_at)
              VALUES (@Id, @TenantId, @ShipmentId, @ProviderId, @ContractId, @ContractRateId,
              @InvoiceNumber, @InvoiceAmount, @ExpectedAmount, @Difference, @DifferencePercent,
              @Currency, @Status, @AuditNotes, @CreatedAt)",
            new { audit.Id, audit.TenantId, audit.ShipmentId, audit.ProviderId, audit.ContractId, audit.ContractRateId,
                audit.InvoiceNumber, audit.InvoiceAmount, audit.ExpectedAmount, audit.Difference, audit.DifferencePercent,
                audit.Currency, audit.Status, audit.AuditNotes, audit.CreatedAt });
        return audit.Id;
    }

    public async Task UpdateStatusAsync(Guid id, Guid tenantId, string status, string? notes, string? reviewedBy)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.invoice_audits SET status = @Status, audit_notes = @Notes,
              reviewed_by = @ReviewedBy, reviewed_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Status = status, Notes = notes, ReviewedBy = reviewedBy, Now = DateTime.UtcNow });
    }
}
