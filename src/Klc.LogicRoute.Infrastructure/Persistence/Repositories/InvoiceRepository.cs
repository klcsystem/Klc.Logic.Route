using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class InvoiceRepository(IPostgresConnectionFactory connectionFactory) : IInvoiceRepository
{
    public async Task<Invoice?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var invoice = await conn.QueryFirstOrDefaultAsync<Invoice>(
            "SELECT * FROM logistics.invoices WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });

        if (invoice != null)
        {
            invoice.Lines = (await GetLinesAsync(invoice.Id)).ToList();
        }

        return invoice;
    }

    public async Task<IEnumerable<Invoice>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<Invoice>(
            @"SELECT * FROM logistics.invoices
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<Guid> InsertAsync(Invoice invoice)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.invoices
              (id, tenant_id, invoice_number, customer_id, customer_name, period_month, period_year,
               total_amount, currency, status, notes, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @InvoiceNumber, @CustomerId, @CustomerName, @PeriodMonth, @PeriodYear,
               @TotalAmount, @Currency, @Status, @Notes, FALSE, @CreatedAt, @CreatedBy)",
            invoice);
        return invoice.Id;
    }

    public async Task InsertLineAsync(InvoiceLine line)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.invoice_lines
              (id, tenant_id, invoice_id, shipment_id, description, quantity, unit_price, amount,
               is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @InvoiceId, @ShipmentId, @Description, @Quantity, @UnitPrice, @Amount,
               FALSE, @CreatedAt, @CreatedBy)",
            line);
    }

    public async Task<IEnumerable<InvoiceLine>> GetLinesAsync(Guid invoiceId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<InvoiceLine>(
            "SELECT * FROM logistics.invoice_lines WHERE invoice_id = @InvoiceId AND is_deleted = FALSE ORDER BY created_at",
            new { InvoiceId = invoiceId });
    }

    public async Task UpdateStatusAsync(Guid id, Guid tenantId, string status, DateTime? statusDate)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();

        var sentAt = status == "Sent" ? statusDate : null;
        var paidAt = status == "Paid" ? statusDate : null;

        await conn.ExecuteAsync(
            @"UPDATE logistics.invoices
              SET status = @Status, sent_at = COALESCE(@SentAt, sent_at), paid_at = COALESCE(@PaidAt, paid_at),
                  updated_at = @Now
              WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Status = status, SentAt = sentAt, PaidAt = paidAt, Now = DateTime.UtcNow });
    }
}
