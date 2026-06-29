using Klc.LogicRoute.Application.Tracking;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.BackgroundJobs;

public class DelayMonitorJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DelayMonitorJob> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    public DelayMonitorJob(
        IServiceScopeFactory scopeFactory,
        ILogger<DelayMonitorJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Delay Monitor Job started — checking every {Interval}", Interval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var delayPredictionService = scope.ServiceProvider.GetRequiredService<IDelayPredictionService>();

                var warnings = await delayPredictionService.CheckAllActiveShipmentsAsync();

                if (warnings.Count > 0)
                {
                    _logger.LogWarning(
                        "Delay Monitor: {Count} delay warnings detected — " +
                        "CRITICAL: {Critical}, HIGH: {High}, WARNING: {Warning}",
                        warnings.Count,
                        warnings.Count(w => w.Severity == "CRITICAL"),
                        warnings.Count(w => w.Severity == "HIGH"),
                        warnings.Count(w => w.Severity == "WARNING"));
                }
                else
                {
                    _logger.LogDebug("Delay Monitor: No delay warnings detected");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Delay Monitor Job error");
            }

            await Task.Delay(Interval, stoppingToken);
        }

        _logger.LogInformation("Delay Monitor Job stopped");
    }
}
