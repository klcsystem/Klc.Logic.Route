using Dapper;
using Klc.LogicRoute.Application.Pipeline;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Infrastructure.Persistence;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.BackgroundJobs;

/// <summary>
/// Background job that runs every 30 minutes to find pending, unbatched orders
/// and groups them into batches using AutoBatchService.
/// Batches are stored as a batch_reference on each order.
/// </summary>
public class AutoBatchJob : BackgroundService
{
    private readonly IPostgresConnectionFactory _connectionFactory;
    private readonly IAutoBatchService _autoBatchService;
    private readonly ILogger<AutoBatchJob> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(30);

    public AutoBatchJob(
        IPostgresConnectionFactory connectionFactory,
        IAutoBatchService autoBatchService,
        ILogger<AutoBatchJob> logger)
    {
        _connectionFactory = connectionFactory;
        _autoBatchService = autoBatchService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Auto-Batch Job started (interval: {Interval})", Interval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await BatchPendingOrdersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Auto-Batch Job encountered an unhandled error");
            }

            await Task.Delay(Interval, stoppingToken);
        }

        _logger.LogInformation("Auto-Batch Job stopped");
    }

    private async Task BatchPendingOrdersAsync(CancellationToken cancellationToken)
    {
        // Get all pending orders not yet assigned to a batch, grouped by tenant
        var pendingOrders = await GetUnbatchedPendingOrdersAsync(cancellationToken);
        var orderList = pendingOrders.ToList();

        if (orderList.Count == 0)
        {
            _logger.LogDebug("Auto-Batch: No unbatched pending orders found");
            return;
        }

        _logger.LogInformation("Auto-Batch: Found {Count} unbatched pending orders", orderList.Count);

        // Process per tenant
        var tenantGroups = orderList.GroupBy(o => o.TenantId);
        var totalBatches = 0;

        foreach (var tenantGroup in tenantGroups)
        {
            var tenantId = tenantGroup.Key;
            var tenantOrders = tenantGroup.ToList();

            var batches = _autoBatchService.GroupIntoBatches(tenantOrders, tenantId);

            foreach (var batch in batches)
            {
                await StoreBatchAsync(batch.BatchName, batch.OrderIds, cancellationToken);
                totalBatches++;
            }
        }

        if (totalBatches > 0)
        {
            _logger.LogInformation("Auto-Batch: Created {BatchCount} batches from {OrderCount} orders",
                totalBatches, orderList.Count);
        }
    }

    private async Task<IEnumerable<Order>> GetUnbatchedPendingOrdersAsync(CancellationToken cancellationToken)
    {
        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(cancellationToken);

        // Status 1 = Pending; batch_reference IS NULL means not yet batched
        return await conn.QueryAsync<Order>(
            @"SELECT id, tenant_id, order_number, erp_reference_id, erp_connection_id,
                     customer_name, destination_address, destination_city,
                     destination_lat, destination_lng, total_weight_kg, total_volume_m3,
                     is_hazardous, requires_cold_chain, status, priority,
                     requested_delivery_date, notes
              FROM logistics.orders
              WHERE status = 1
                AND is_deleted = FALSE
                AND (batch_reference IS NULL OR batch_reference = '')
              ORDER BY requested_delivery_date, created_at");
    }

    private async Task StoreBatchAsync(string batchName, List<Guid> orderIds, CancellationToken cancellationToken)
    {
        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(cancellationToken);

        // Mark orders with the batch reference
        await conn.ExecuteAsync(
            @"UPDATE logistics.orders
              SET batch_reference = @BatchName, updated_at = @Now
              WHERE id = ANY(@OrderIds)",
            new { BatchName = batchName, OrderIds = orderIds.ToArray(), Now = DateTime.UtcNow });

        _logger.LogDebug("Auto-Batch: Assigned {Count} orders to batch {BatchName}",
            orderIds.Count, batchName);
    }
}
