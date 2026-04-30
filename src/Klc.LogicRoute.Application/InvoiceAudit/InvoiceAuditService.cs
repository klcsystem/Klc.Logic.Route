using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.InvoiceAudit;

public class InvoiceAuditService(
    IShipmentRepository shipmentRepository,
    IInvoiceAuditRepository invoiceAuditRepository) : IInvoiceAuditService
{
    public async Task<Domain.Entities.InvoiceAudit> AuditAsync(Guid shipmentId, string invoiceNumber, decimal invoiceAmount, Guid tenantId)
    {
        var shipment = await shipmentRepository.GetByIdAsync(shipmentId, tenantId)
            ?? throw new KeyNotFoundException("Sevkiyat bulunamadi");

        var expectedAmount = shipment.CalculatedPrice ?? 0m;
        var difference = invoiceAmount - expectedAmount;
        var differencePercent = expectedAmount > 0 ? difference / expectedAmount * 100 : 0;

        var status = Math.Abs(differencePercent) switch
        {
            <= 1 => "Approved",
            <= 5 => "NeedsReview",
            _ => "Flagged"
        };

        var audit = new Domain.Entities.InvoiceAudit
        {
            TenantId = tenantId,
            ShipmentId = shipmentId,
            ProviderId = shipment.SelectedProviderId ?? Guid.Empty,
            ContractId = null,
            InvoiceNumber = invoiceNumber,
            InvoiceAmount = invoiceAmount,
            ExpectedAmount = expectedAmount,
            Difference = difference,
            DifferencePercent = Math.Round(differencePercent, 2),
            Currency = shipment.Currency,
            Status = status,
            AuditNotes = BuildNotes(difference, differencePercent, status)
        };

        await invoiceAuditRepository.InsertAsync(audit);
        return audit;
    }

    private static string BuildNotes(decimal difference, decimal differencePercent, string status)
    {
        if (status == "Approved")
            return "Fatura anlasma tarifesiyle uyumlu";
        if (status == "NeedsReview")
            return $"Fark: {difference:F2} TRY (%{differencePercent:F1}) — inceleme gerekli";
        return $"UYARI: Fark: {difference:F2} TRY (%{differencePercent:F1}) — anlasma disinda";
    }
}
