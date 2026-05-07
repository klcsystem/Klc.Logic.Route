using System.Text;
using System.Text.Json;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Domain.Events;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;

namespace Klc.LogicRoute.Infrastructure.Messaging;

public class RabbitMqEventBus : IEventBus, IAsyncDisposable
{
    private const string ExchangeName = "logicroute.events";

    private readonly ILogger<RabbitMqEventBus> _logger;
    private readonly string _hostName;
    private readonly int _port;
    private readonly string _userName;
    private readonly string _password;

    private IConnection? _connection;
    private IChannel? _channel;
    private bool _initialized;

    public RabbitMqEventBus(IConfiguration configuration, ILogger<RabbitMqEventBus> logger)
    {
        _logger = logger;
        _hostName = configuration["RabbitMQ:Host"] ?? "localhost";
        _port = int.TryParse(configuration["RabbitMQ:Port"], out var port) ? port : 5672;
        _userName = configuration["RabbitMQ:Username"] ?? "guest";
        _password = configuration["RabbitMQ:Password"] ?? "guest";
    }

    public async Task PublishAsync<T>(T @event, CancellationToken cancellationToken = default) where T : IDomainEvent
    {
        try
        {
            await EnsureInitializedAsync(cancellationToken);

            var routingKey = typeof(T).Name;
            var messageBody = JsonSerializer.Serialize(@event);
            var body = Encoding.UTF8.GetBytes(messageBody);

            var properties = new BasicProperties
            {
                ContentType = "application/json",
                DeliveryMode = DeliveryModes.Persistent,
                MessageId = @event.EventId.ToString(),
                Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds())
            };

            await _channel!.BasicPublishAsync(
                exchange: ExchangeName,
                routingKey: routingKey,
                mandatory: false,
                basicProperties: properties,
                body: body,
                cancellationToken: cancellationToken);

            _logger.LogInformation("Published event {EventType} with Id {EventId}",
                routingKey, @event.EventId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish event {EventType}", typeof(T).Name);
            throw;
        }
    }

    private async Task EnsureInitializedAsync(CancellationToken cancellationToken)
    {
        if (_initialized && _connection is { IsOpen: true } && _channel is { IsOpen: true })
            return;

        var factory = new ConnectionFactory
        {
            HostName = _hostName,
            Port = _port,
            UserName = _userName,
            Password = _password
        };

        _connection = await factory.CreateConnectionAsync(cancellationToken);
        _channel = await _connection.CreateChannelAsync(cancellationToken: cancellationToken);

        await _channel.ExchangeDeclareAsync(
            exchange: ExchangeName,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false,
            cancellationToken: cancellationToken);

        _initialized = true;
        _logger.LogInformation("RabbitMQ event bus initialized (exchange: {Exchange})", ExchangeName);
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel is not null)
        {
            await _channel.CloseAsync();
            _channel.Dispose();
        }

        if (_connection is not null)
        {
            await _connection.CloseAsync();
            _connection.Dispose();
        }
    }
}
