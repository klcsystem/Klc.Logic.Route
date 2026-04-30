using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Application.InvoiceAudit;

public interface IInvoiceAuditService
{
    Task<Domain.Entities.InvoiceAudit> AuditAsync(Guid shipmentId, string invoiceNumber, decimal invoiceAmount, Guid tenantId);
}
