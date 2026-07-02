using Dapper;
using Klc.LogicRoute.Application.Pipeline;
using Klc.LogicRoute.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.BackgroundJobs;

public class LogisticsPipelineOrchestrator : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IPostgresConnectionFactory _connectionFactory;
    private readonly ILogger<LogisticsPipelineOrchestrator> _logger;
    private readonly TimeSpan _interval;
    private readonly bool _enabled;

    // Shared state for manual trigger and status queries
    private static readonly object Lock = new();
    private static DateTime? _lastRunTime;
    private static string _lastRunStatus = "Never";
    private static string _lastRunDetails = "";
    private static bool _manualTriggerRequested;
    private static Guid? _manualTriggerTenantId;

    public LogisticsPipelineOrchestrator(
        IServiceScopeFactory scopeFactory,
        IPostgresConnectionFactory connectionFactory,
        IConfiguration configuration,
        ILogger<LogisticsPipelineOrchestrator> logger)
    {
        _scopeFactory = scopeFactory;
        _connectionFactory = connectionFactory;
        _logger = logger;

        var intervalMinutes = configuration.GetValue("Pipeline:IntervalMinutes", 30);
        _interval = TimeSpan.FromMinutes(intervalMinutes);
        _enabled = configuration.GetValue("Pipeline:Enabled", true);
    }

    /// <summary>
    /// Triggers a manual pipeline run for the specified tenant.
    /// </summary>
    public static void RequestManualRun(Guid tenantId)
    {
        lock (Lock)
        {
            _manualTriggerRequested = true;
            _manualTriggerTenantId = tenantId;
        }
    }

    /// <summary>
    /// Returns the last pipeline run status.
    /// </summary>
    public static PipelineStatus GetStatus()
    {
        lock (Lock)
        {
            return new PipelineStatus(_lastRunTime, _lastRunStatus, _lastRunDetails);
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_enabled)
        {
            _logger.LogInformation("Logistics Pipeline Orchestrator is disabled via configuration");
            return;
        }

        _logger.LogInformation("Logistics Pipeline Orchestrator started, interval: {Interval}", _interval);

        while (!stoppingToken.IsCancellationRequested)
        {
            // Check for manual trigger
            Guid? manualTenantId = null;
            lock (Lock)
            {
                if (_manualTriggerRequested)
                {
                    manualTenantId = _manualTriggerTenantId;
                    _manualTriggerRequested = false;
                    _manualTriggerTenantId = null;
                }
            }

            if (manualTenantId.HasValue)
            {
                await RunPipelineForTenantAsync(manualTenantId.Value, stoppingToken);
            }
            else
            {
                await RunPipelineAsync(stoppingToken);
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("Logistics Pipeline Orchestrator stopped");
    }

    private async Task RunPipelineAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Pipeline run starting (scheduled)");

            // Discover distinct tenants with pending orders
            var tenantIds = await GetTenantsWithPendingOrdersAsync(cancellationToken);

            if (tenantIds.Count == 0)
            {
                UpdateStatus("NoWork", "No pending orders with coordinates found.");
                _logger.LogDebug("Pipeline run: no pending orders found");
                return;
            }

            foreach (var tenantId in tenantIds)
            {
                await RunPipelineForTenantAsync(tenantId, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            UpdateStatus("Failed", $"Pipeline error: {ex.Message}");
            _logger.LogError(ex, "Pipeline run failed");
        }
    }

    private async Task RunPipelineForTenantAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Pipeline running for tenant {TenantId}", tenantId);

            // Step 1: Get pending orders with coordinates grouped by region
            var orderGroups = await GetPendingOrderGroupsAsync(tenantId, cancellationToken);

            if (orderGroups.Count == 0)
            {
                UpdateStatus("NoWork", $"Tenant {tenantId}: no pending orders.");
                return;
            }

            using var scope = _scopeFactory.CreateScope();
            var autoRouteService = scope.ServiceProvider.GetRequiredService<IAutoRouteService>();
            var autoAssignService = scope.ServiceProvider.GetRequiredService<IAutoAssignService>();

            var totalRoutes = 0;
            var totalAssigned = 0;

            foreach (var (region, orderIds) in orderGroups)
            {
                _logger.LogInformation("Processing region {Region} with {OrderCount} orders",
                    region, orderIds.Count);

                // Step 2: Auto-Route
                var optimizationId = await autoRouteService.OptimizeAsync(orderIds, tenantId, cancellationToken);

                // Step 3: Auto-Assign
                var assignSummary = await autoAssignService.AssignAsync(optimizationId, tenantId, cancellationToken);

                totalRoutes += assignSummary.RoutesAssigned;
                totalAssigned += assignSummary.OrdersUpdated;
            }

            UpdateStatus("Completed",
                $"Tenant {tenantId}: {orderGroups.Count} region(s), {totalRoutes} routes, {totalAssigned} orders assigned.");

            _logger.LogInformation("Pipeline completed for tenant {TenantId}: {Routes} routes, {Orders} orders",
                tenantId, totalRoutes, totalAssigned);
        }
        catch (Exception ex)
        {
            UpdateStatus("Failed", $"Tenant {tenantId}: {ex.Message}");
            _logger.LogError(ex, "Pipeline failed for tenant {TenantId}", tenantId);
        }
    }

    private async Task<List<Guid>> GetTenantsWithPendingOrdersAsync(CancellationToken cancellationToken)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        const string sql = """
            SELECT DISTINCT tenant_id
            FROM logistics.orders
            WHERE status = 1
              AND is_deleted = false
              AND destination_lat IS NOT NULL
              AND destination_lng IS NOT NULL
            """;

        var result = await connection.QueryAsync<Guid>(sql);
        return result.ToList();
    }

    private async Task<List<(string Region, List<Guid> OrderIds)>> GetPendingOrderGroupsAsync(
        Guid tenantId, CancellationToken cancellationToken)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        const string sql = """
            SELECT id, destination_lat, destination_lng, destination_city
            FROM logistics.orders
            WHERE tenant_id = @TenantId
              AND status = 1
              AND is_deleted = false
              AND destination_lat IS NOT NULL
              AND destination_lng IS NOT NULL
            ORDER BY destination_city, id
            """;

        var orders = (await connection.QueryAsync<PendingOrderInfo>(
            sql, new { TenantId = tenantId })).ToList();

        if (orders.Count == 0)
            return [];

        // Group by destination city (region). If city is null, group as "Unknown".
        var groups = orders
            .GroupBy(o => o.DestinationCity ?? "Unknown")
            .Select(g => (Region: g.Key, OrderIds: g.Select(o => o.Id).ToList()))
            .ToList();

        return groups;
    }

    private static void UpdateStatus(string status, string details)
    {
        lock (Lock)
        {
            _lastRunTime = DateTime.UtcNow;
            _lastRunStatus = status;
            _lastRunDetails = details;
        }
    }

    private class PendingOrderInfo
    {
        public Guid Id { get; set; }
        public double DestinationLat { get; set; }
        public double DestinationLng { get; set; }
        public string? DestinationCity { get; set; }
    }
}

public record PipelineStatus(DateTime? LastRunTime, string Status, string Details);
