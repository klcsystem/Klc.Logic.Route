using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class RouteStop : BaseEntity
{
    public Guid RouteId { get; set; }
    public Guid? ShipmentId { get; set; }
    public int StopOrder { get; set; }
    public string StopType { get; set; } = "Delivery"; // Pickup, Delivery, Depot
    public string? Address { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public DateTime? ArrivalTime { get; set; }
    public DateTime? DepartureTime { get; set; }
    public DateTime? TimeWindowStart { get; set; }
    public DateTime? TimeWindowEnd { get; set; }
    public int ServiceTimeMinutes { get; set; }
}
