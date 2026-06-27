using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class NotificationTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public NotificationChannel Channel { get; set; }
    public DeliveryNotificationStage Stage { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string TemplateBody { get; set; } = string.Empty;
    public string Variables { get; set; } = string.Empty; // comma-separated: CustomerName,ETA,TrackingUrl
    public bool IsActive { get; set; } = true;
}
