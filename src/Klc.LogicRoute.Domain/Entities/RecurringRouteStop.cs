using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class RecurringRouteStop : BaseEntity
{
    public Guid RecurringRouteId { get; set; }
    public int StopOrder { get; set; }
    public string StopType { get; set; } = "Delivery"; // Pickup, Delivery, Depot
    public string? Address { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string? TimeWindowStart { get; set; } // HH:mm format (time-of-day, not absolute)
    public string? TimeWindowEnd { get; set; }   // HH:mm format
    public int ServiceTimeMinutes { get; set; }
    public string? CustomerName { get; set; }
    public string? Notes { get; set; }
}
