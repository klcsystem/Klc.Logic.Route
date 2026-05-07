using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Klc.LogicRoute.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        _logger.LogInformation("Client {ConnectionId} joined user group {UserId}",
            Context.ConnectionId, userId);
    }

    public async Task SendNotification(string userId, string title, string message)
    {
        await Clients.Group($"user-{userId}")
            .SendAsync("ReceiveNotification", new { userId, title, message, timestamp = DateTime.UtcNow });
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Notification client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Notification client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
