using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class InvoiceAudit : BaseEntity
{
    public Guid ShipmentId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid? ContractId { get; set; }
    public Guid? ContractRateId { get; set; }
    public string? InvoiceNumber { get; set; }
    public decimal InvoiceAmount { get; set; }
    public decimal ExpectedAmount { get; set; }
    public decimal Difference { get; set; }
    public decimal DifferencePercent { get; set; }
    public string? Currency { get; set; } = "TRY";
    public string Status { get; set; } = "Pending";
    public string? AuditNotes { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedBy { get; set; }
}
