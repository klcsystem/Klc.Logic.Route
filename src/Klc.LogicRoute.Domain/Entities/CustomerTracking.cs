using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class CustomerTracking : BaseEntity
{
    public Guid ShipmentId { get; set; }
    public string TrackingToken { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public DateTime? EstimatedArrival { get; set; }
    public DateTime? LastEtaUpdate { get; set; }
    public bool IsActive { get; set; } = true;
}
