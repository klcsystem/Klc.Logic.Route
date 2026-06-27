using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class DeliveryFeedback : BaseEntity
{
    public Guid? ShipmentId { get; set; }
    public Guid? OrderId { get; set; }
    public int Rating { get; set; } // 1-5
    public string? Comment { get; set; }
    public FeedbackType FeedbackType { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public Guid? DriverId { get; set; }
}
