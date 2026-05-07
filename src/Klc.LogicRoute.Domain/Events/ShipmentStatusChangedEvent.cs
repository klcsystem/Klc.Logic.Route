namespace Klc.LogicRoute.Domain.Events;

public record ShipmentStatusChangedEvent(
    Guid ShipmentId,
    string OldStatus,
    string NewStatus,
    DateTime Timestamp) : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
}
