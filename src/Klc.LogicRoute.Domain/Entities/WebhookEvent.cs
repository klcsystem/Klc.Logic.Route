using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class WebhookEvent : BaseEntity
{
    public string ProviderCode { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string? TrackingNumber { get; set; }
    public string? Payload { get; set; }
    public string Status { get; set; } = "Received";
    public string? ProcessingNotes { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
