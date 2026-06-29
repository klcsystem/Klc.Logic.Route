using Klc.LogicRoute.Application.Learning;
using Klc.LogicRoute.Infrastructure.Persistence;
using Dapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.BackgroundJobs;

/// <summary>
/// Background job that runs daily at midnight (Turkey time, UTC+3).
/// Processes all completed deliveries from the last 24 hours and updates
/// all learned parameters (service times, addresses, traffic patterns).
/// </summary>
public class LearningOrchestrator : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LearningOrchestrator> _logger;

    // Run at midnight Turkey time (21:00 UTC previous day)
    private static readonly TimeSpan TargetTimeUtc = TimeSpan.FromHours(21);
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(5);

    public LearningOrchestrator(
        IServiceProvider serviceProvider,
        ILogger<LearningOrchestrator> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Learning Orchestrator started — runs daily at midnight (TR time)");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;
                var nextRun = GetNextRunTime(now);
                var delay = nextRun - now;

                if (delay > TimeSpan.Zero)
                {
                    _logger.LogDebug("Next learning run scheduled at {NextRun:u} (in {Delay})", nextRun, delay);

                    // Wait until the scheduled time, checking periodically
                    while (DateTime.UtcNow < nextRun && !stoppingToken.IsCancellationRequested)
                    {
                        var remaining = nextRun - DateTime.UtcNow;
                        var waitTime = remaining < CheckInterval ? remaining : CheckInterval;
                        if (waitTime > TimeSpan.Zero)
                            await Task.Delay(waitTime, stoppingToken);
                    }
                }

                if (stoppingToken.IsCancellationRequested) break;

                await RunLearningCycleAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in learning orchestrator cycle");
                // Wait before retrying on error
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
        }

        _logger.LogInformation("Learning Orchestrator stopped");
    }

    /// <summary>
    /// Manually trigger a learning cycle (used by POST /api/learning/retrain).
    /// </summary>
    public async Task TriggerManualRunAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Manual learning cycle triggered");
        await RunLearningCycleAsync(ct);
    }

    private async Task RunLearningCycleAsync(CancellationToken ct)
    {
        _logger.LogInformation("Starting daily learning cycle");
        var sw = System.Diagnostics.Stopwatch.StartNew();

        using var scope = _serviceProvider.CreateScope();
        var learningService = scope.ServiceProvider.GetRequiredService<ILearningService>();
        var connectionFactory = scope.ServiceProvider.GetRequiredService<IPostgresConnectionFactory>();

        // Get all active tenant IDs
        var tenantIds = await GetActiveTenantIdsAsync(connectionFactory);

        var to = DateTime.UtcNow;
        var from = to.AddHours(-24);

        foreach (var tenantId in tenantIds)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                await learningService.ProcessCompletedDeliveriesAsync(tenantId, from, to, ct);
                _logger.LogInformation("Learning cycle completed for tenant {TenantId}", tenantId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Learning cycle failed for tenant {TenantId}", tenantId);
            }
        }

        sw.Stop();
        _logger.LogInformation("Daily learning cycle completed in {Elapsed}ms for {TenantCount} tenants",
            sw.ElapsedMilliseconds, tenantIds.Count);
    }

    private static async Task<List<Guid>> GetActiveTenantIdsAsync(IPostgresConnectionFactory connectionFactory)
    {
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = "SELECT id FROM tenants WHERE is_deleted = false";
        var result = await connection.QueryAsync<Guid>(sql);
        return result.ToList();
    }

    private static DateTime GetNextRunTime(DateTime utcNow)
    {
        var todayRun = utcNow.Date.Add(TargetTimeUtc);
        return utcNow < todayRun ? todayRun : todayRun.AddDays(1);
    }
}
