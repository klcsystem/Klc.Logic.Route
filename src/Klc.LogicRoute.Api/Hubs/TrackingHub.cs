using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Klc.LogicRoute.Api.Hubs;

[Authorize]
public class TrackingHub : Hub
{
    private readonly ILogger<TrackingHub> _logger;

    public TrackingHub(ILogger<TrackingHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinShipmentGroup(string shipmentId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"shipment-{shipmentId}");
        _logger.LogInformation("Client {ConnectionId} joined shipment group {ShipmentId}",
            Context.ConnectionId, shipmentId);
    }

    public async Task LeaveShipmentGroup(string shipmentId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"shipment-{shipmentId}");
        _logger.LogInformation("Client {ConnectionId} left shipment group {ShipmentId}",
            Context.ConnectionId, shipmentId);
    }

    public async Task SendLocationUpdate(string shipmentId, double lat, double lng, DateTime? eta)
    {
        await Clients.Group($"shipment-{shipmentId}")
            .SendAsync("ReceiveLocationUpdate", new { shipmentId, lat, lng, eta });
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
