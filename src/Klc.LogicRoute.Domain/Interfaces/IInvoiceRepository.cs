using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IInvoiceRepository
{
    Task<Invoice?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<Invoice>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<Guid> InsertAsync(Invoice invoice);
    Task InsertLineAsync(InvoiceLine line);
    Task<IEnumerable<InvoiceLine>> GetLinesAsync(Guid invoiceId);
    Task UpdateStatusAsync(Guid id, Guid tenantId, string status, DateTime? statusDate);
}
