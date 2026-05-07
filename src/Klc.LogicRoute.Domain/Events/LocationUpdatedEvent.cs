namespace Klc.LogicRoute.Domain.Events;

public record LocationUpdatedEvent(
    Guid ShipmentId,
    Guid DriverId,
    double Lat,
    double Lng,
    DateTime Timestamp) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}
