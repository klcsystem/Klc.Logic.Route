using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class Invoice : BaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public int PeriodMonth { get; set; }
    public int PeriodYear { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "TRY";
    public string Status { get; set; } = "Draft"; // Draft, Sent, Paid
    public DateTime? SentAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }

    public List<InvoiceLine> Lines { get; set; } = [];
}
