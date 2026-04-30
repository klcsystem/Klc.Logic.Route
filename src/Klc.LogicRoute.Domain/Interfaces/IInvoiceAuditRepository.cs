using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IInvoiceAuditRepository
{
    Task<IEnumerable<InvoiceAudit>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<InvoiceAudit?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> InsertAsync(InvoiceAudit audit);
    Task UpdateStatusAsync(Guid id, Guid tenantId, string status, string? notes, string? reviewedBy);
}
