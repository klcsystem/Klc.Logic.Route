using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Klc.LogicRoute.Api.Hubs;

[Authorize]
public class SimulationHub : Hub
{
    private readonly ILogger<SimulationHub> _logger;

    public SimulationHub(ILogger<SimulationHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinSimulationGroup(string scenarioId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"simulation-{scenarioId}");
        _logger.LogInformation("Client {ConnectionId} joined simulation group {ScenarioId}",
            Context.ConnectionId, scenarioId);
    }

    public async Task LeaveSimulationGroup(string scenarioId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"simulation-{scenarioId}");
    }
}
