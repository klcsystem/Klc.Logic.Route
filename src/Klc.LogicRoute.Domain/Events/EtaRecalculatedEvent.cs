namespace Klc.LogicRoute.Domain.Events;

public record EtaRecalculatedEvent(
    Guid ShipmentId,
    DateTime NewEta,
    DateTime Timestamp) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}
