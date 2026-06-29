using Dapper;
using Klc.LogicRoute.Application.Geocoding;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Klc.LogicRoute.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.BackgroundJobs;

/// <summary>
/// Background service that periodically syncs orders from all active ERP connections.
/// Runs every 15 minutes (configurable). Skips connections synced less than 5 minutes ago.
/// </summary>
public class ErpAutoSyncJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IPostgresConnectionFactory _connectionFactory;
    private readonly ILogger<ErpAutoSyncJob> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan MinSyncGap = TimeSpan.FromMinutes(5);

    public ErpAutoSyncJob(
        IServiceScopeFactory scopeFactory,
        IPostgresConnectionFactory connectionFactory,
        ILogger<ErpAutoSyncJob> logger)
    {
        _scopeFactory = scopeFactory;
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ERP Auto-Sync Job started (interval: {Interval})", Interval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncAllConnectionsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ERP Auto-Sync Job encountered an unhandled error");
            }

            await Task.Delay(Interval, stoppingToken);
        }

        _logger.LogInformation("ERP Auto-Sync Job stopped");
    }

    private async Task SyncAllConnectionsAsync(CancellationToken cancellationToken)
    {
        // Fetch all active ERP connections across all tenants directly via SQL
        // (the repository requires a tenantId, but the background job needs all tenants)
        var activeConnections = await GetAllActiveConnectionsAsync(cancellationToken);

        if (!activeConnections.Any())
        {
            _logger.LogDebug("ERP Auto-Sync: No active ERP connections found");
            return;
        }

        _logger.LogInformation("ERP Auto-Sync: Processing {Count} active connections", activeConnections.Count());

        foreach (var connection in activeConnections)
        {
            // Skip if synced less than 5 minutes ago
            if (connection.LastSyncAt.HasValue &&
                DateTime.UtcNow - connection.LastSyncAt.Value < MinSyncGap)
            {
                _logger.LogDebug(
                    "ERP Auto-Sync: Skipping {ConnectionName} (last synced {Ago} ago)",
                    connection.Name,
                    DateTime.UtcNow - connection.LastSyncAt.Value);
                continue;
            }

            await SyncConnectionAsync(connection, cancellationToken);
        }
    }

    private async Task SyncConnectionAsync(ErpConnection connection, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "ERP Auto-Sync: Starting sync for {ConnectionName} (type: {ErpType}, tenant: {TenantId})",
            connection.Name, connection.ErpType, connection.TenantId);

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var erpAdapters = scope.ServiceProvider.GetServices<IErpAdapter>();
            var orderRepository = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
            var geocodingService = scope.ServiceProvider.GetRequiredService<IGeocodingService>();
            var erpConnectionRepository = scope.ServiceProvider.GetRequiredService<IErpConnectionRepository>();

            // Find the adapter that supports this connection's ERP type
            var adapter = erpAdapters.FirstOrDefault(a => a.SupportedType == connection.ErpType);
            if (adapter is null)
            {
                _logger.LogWarning(
                    "ERP Auto-Sync: No adapter found for ERP type {ErpType} (connection: {ConnectionName})",
                    connection.ErpType, connection.Name);
                await erpConnectionRepository.UpdateSyncStatusAsync(
                    connection.Id, connection.TenantId, "Error: No adapter for ERP type");
                return;
            }

            // Sync orders since last successful sync (or all if first sync)
            var since = connection.LastSyncAt;
            var orders = await adapter.SyncOrdersAsync(connection, since);

            if (orders.Count == 0)
            {
                _logger.LogInformation(
                    "ERP Auto-Sync: No new orders from {ConnectionName}",
                    connection.Name);
                await erpConnectionRepository.UpdateSyncStatusAsync(
                    connection.Id, connection.TenantId, "Success: 0 orders");
                return;
            }

            // Geocode and save each order
            var savedCount = 0;
            foreach (var order in orders)
            {
                try
                {
                    // Skip duplicate orders (same ERP reference)
                    if (await OrderExistsAsync(order.ErpReferenceId, order.ErpConnectionId, connection.TenantId))
                    {
                        _logger.LogDebug(
                            "ERP Auto-Sync: Skipping duplicate order {OrderNumber}",
                            order.OrderNumber);
                        continue;
                    }

                    // Geocode the order's addresses
                    await geocodingService.EnrichOrderCoordinatesAsync(order, cancellationToken);

                    // Save to database
                    await orderRepository.InsertAsync(order);
                    savedCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "ERP Auto-Sync: Failed to save order {OrderNumber}",
                        order.OrderNumber);
                }
            }

            var statusMessage = $"Success: {savedCount} new orders (of {orders.Count} total)";
            await erpConnectionRepository.UpdateSyncStatusAsync(
                connection.Id, connection.TenantId, statusMessage);

            _logger.LogInformation(
                "ERP Auto-Sync: Completed {ConnectionName} — {StatusMessage}",
                connection.Name, statusMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "ERP Auto-Sync: Failed for {ConnectionName}",
                connection.Name);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<IErpConnectionRepository>();
                await repo.UpdateSyncStatusAsync(
                    connection.Id, connection.TenantId,
                    $"Error: {ex.Message[..Math.Min(200, ex.Message.Length)]}");
            }
            catch (Exception statusEx)
            {
                _logger.LogWarning(statusEx, "ERP Auto-Sync: Failed to update sync status");
            }
        }
    }

    private async Task<IEnumerable<ErpConnection>> GetAllActiveConnectionsAsync(CancellationToken cancellationToken)
    {
        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(cancellationToken);
        return await conn.QueryAsync<ErpConnection>(
            "SELECT * FROM logistics.erp_connections WHERE is_active = TRUE AND is_deleted = FALSE ORDER BY name");
    }

    private async Task<bool> OrderExistsAsync(string? erpReferenceId, Guid? erpConnectionId, Guid tenantId)
    {
        if (string.IsNullOrEmpty(erpReferenceId) || erpConnectionId is null)
            return false;

        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var count = await conn.ExecuteScalarAsync<int>(
            @"SELECT COUNT(1) FROM logistics.orders
              WHERE erp_reference_id = @ErpReferenceId
                AND erp_connection_id = @ErpConnectionId
                AND tenant_id = @TenantId
                AND is_deleted = FALSE",
            new { ErpReferenceId = erpReferenceId, ErpConnectionId = erpConnectionId, TenantId = tenantId });
        return count > 0;
    }
}
