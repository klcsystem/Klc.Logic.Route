namespace Klc.LogicRoute.Application.Pipeline.Models;

/// <summary>
/// Represents a group of orders batched together for route optimization.
/// </summary>
public class OrderBatch
{
    public Guid BatchId { get; set; } = Guid.NewGuid();
    public string BatchName { get; set; } = string.Empty;
    public List<Guid> OrderIds { get; set; } = [];
    public decimal TotalWeightKg { get; set; }
    public decimal TotalVolumeM3 { get; set; }
    public string? Region { get; set; }
    public DateTime DeliveryDate { get; set; }
    public bool IsHazardous { get; set; }
    public bool RequiresColdChain { get; set; }
    public int OrderCount => OrderIds.Count;
    public Guid TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
