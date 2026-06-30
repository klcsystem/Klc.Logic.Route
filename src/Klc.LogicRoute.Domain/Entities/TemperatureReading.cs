using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class TemperatureReading : BaseEntity
{
    public Guid ShipmentId { get; set; }
    public Guid VehicleId { get; set; }
    public string SensorId { get; set; } = string.Empty;
    public decimal Temperature { get; set; }
    public decimal Humidity { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public DateTime ReadingAt { get; set; }
    public bool IsAlarm { get; set; }
}
