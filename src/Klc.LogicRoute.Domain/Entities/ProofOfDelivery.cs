using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class ProofOfDelivery : BaseEntity
{
    public Guid ShipmentId { get; set; }
    public string? PhotoPath { get; set; }
    public string? SignaturePath { get; set; }
    public string? RecipientName { get; set; }
    public string? Notes { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;
}
