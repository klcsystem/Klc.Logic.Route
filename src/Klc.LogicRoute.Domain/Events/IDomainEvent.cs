namespace Klc.LogicRoute.Domain.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime Timestamp { get; }
}
