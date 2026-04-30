using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class CarrierPerformance : BaseEntity
{
    public Guid ProviderId { get; set; }
    public string? ProviderName { get; set; }
    public int Period { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalShipments { get; set; }
    public int OnTimeDeliveries { get; set; }
    public int LateDeliveries { get; set; }
    public int DamagedShipments { get; set; }
    public int CancelledShipments { get; set; }
    public decimal OnTimePercentage { get; set; }
    public decimal AverageDeliveryHours { get; set; }
    public decimal TotalCost { get; set; }
    public decimal AverageCostPerKg { get; set; }
    public decimal CO2TotalKg { get; set; }
    public decimal OverallScore { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
