using Klc.LogicRoute.Domain.Events;

namespace Klc.LogicRoute.Application.Common.Interfaces;

public interface IEventBus
{
    Task PublishAsync<T>(T @event, CancellationToken cancellationToken = default) where T : IDomainEvent;
}
