using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.CustomerEta.Services;
using Klc.LogicRoute.Application.Notifications;
using Klc.LogicRoute.Application.Tracking.Models;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Tracking;

public class DelayPredictionService : IDelayPredictionService
{
    private readonly IShipmentRepository _shipmentRepository;
    private readonly IEtaCalculationService _etaCalculationService;
    private readonly IOrderRepository _orderRepository;
    private readonly ICacheService _cacheService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<DelayPredictionService> _logger;

    /// <summary>
    /// Minimum predicted delay (in minutes) before a warning is generated.
    /// </summary>
    private const int DelayThresholdMinutes = 15;

    // Known tenant ID for background job context (uses cache to discover active tenants)
    private static readonly TimeSpan AlertCacheTtl = TimeSpan.FromMinutes(10);

    public DelayPredictionService(
        IShipmentRepository shipmentRepository,
        IEtaCalculationService etaCalculationService,
        IOrderRepository orderRepository,
        ICacheService cacheService,
        INotificationService notificationService,
        ILogger<DelayPredictionService> logger)
    {
        _shipmentRepository = shipmentRepository;
        _etaCalculationService = etaCalculationService;
        _orderRepository = orderRepository;
        _cacheService = cacheService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<DelayWarning>> CheckAllActiveShipmentsAsync()
    {
        var warnings = new List<DelayWarning>();

        try
        {
            // Get active tenants from cache (set by API requests)
            var activeTenants = await _cacheService.GetAsync<List<Guid>>("delay_prediction:active_tenants");
            if (activeTenants == null || activeTenants.Count == 0)
            {
                _logger.LogDebug("No active tenants found for delay prediction");
                return warnings;
            }

            foreach (var tenantId in activeTenants)
            {
                var tenantWarnings = await CheckTenantShipmentsAsync(tenantId);
                warnings.AddRange(tenantWarnings);
            }

            // Cache current warnings for the API endpoint
            if (warnings.Count > 0)
            {
                await _cacheService.SetAsync("delay_prediction:current_warnings", warnings, AlertCacheTtl);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running delay prediction check");
        }

        return warnings;
    }

    private async Task<List<DelayWarning>> CheckTenantShipmentsAsync(Guid tenantId)
    {
        var warnings = new List<DelayWarning>();

        var allShipments = await _shipmentRepository.GetAllAsync(tenantId, 1, 500);
        var activeShipments = allShipments.Where(s =>
            s.Status is ShipmentStatus.InTransit or ShipmentStatus.Loading or ShipmentStatus.VehicleAssigned &&
            !s.IsDeleted &&
            s.CurrentLatitude.HasValue &&
            s.CurrentLongitude.HasValue);

        foreach (var shipment in activeShipments)
        {
            var warning = await EvaluateShipmentDelayAsync(shipment, tenantId);
            if (warning != null)
            {
                warnings.Add(warning);
            }
        }

        return warnings;
    }

    private async Task<DelayWarning?> EvaluateShipmentDelayAsync(
        Domain.Entities.Shipment shipment,
        Guid tenantId)
    {
        try
        {
            // Need planned arrival time
            DateTime? plannedArrival = null;
            if (!string.IsNullOrEmpty(shipment.EstimatedArrival) &&
                DateTime.TryParse(shipment.EstimatedArrival, out var parsedEta))
            {
                plannedArrival = parsedEta;
            }
            else if (shipment.RequestedDeliveryDate.HasValue)
            {
                plannedArrival = shipment.RequestedDeliveryDate.Value;
            }

            if (plannedArrival == null)
                return null;

            // Get destination coordinates
            double? destLat = null, destLng = null;
            if (shipment.OrderId.HasValue)
            {
                var order = await _orderRepository.GetByIdAsync(shipment.OrderId.Value, tenantId);
                if (order?.DestinationLat != null && order.DestinationLng != null)
                {
                    destLat = order.DestinationLat;
                    destLng = order.DestinationLng;
                }
            }

            if (destLat == null || destLng == null)
                return null;

            // Calculate current ETA based on current position
            var predictedArrival = _etaCalculationService.CalculateEta(
                (double)shipment.CurrentLatitude!.Value,
                (double)shipment.CurrentLongitude!.Value,
                destLat.Value,
                destLng.Value);

            if (predictedArrival == null)
                return null;

            var delayMinutes = (int)(predictedArrival.Value - plannedArrival.Value).TotalMinutes;

            if (delayMinutes < DelayThresholdMinutes)
                return null;

            var (severity, suggestedAction) = ClassifyDelay(delayMinutes);

            var warning = new DelayWarning(
                shipment.Id,
                tenantId,
                shipment.ShipmentNumber,
                severity,
                delayMinutes,
                plannedArrival.Value,
                predictedArrival.Value,
                shipment.DriverName,
                shipment.DestinationCity,
                suggestedAction,
                DateTime.UtcNow);

            // Send notification to operations
            var notificationType = severity switch
            {
                "CRITICAL" => NotificationType.Error,
                "HIGH" => NotificationType.Warning,
                _ => NotificationType.Warning
            };

            await _notificationService.SendToAllAsync(
                tenantId,
                $"Gecikme Uyarisi — {severity}",
                $"Sevkiyat {shipment.ShipmentNumber}: Tahmini {delayMinutes} dk gecikme. " +
                $"Oneri: {suggestedAction}",
                notificationType);

            _logger.LogWarning(
                "DELAY_{Severity}: Shipment {ShipmentNumber} predicted {DelayMinutes}min delay " +
                "(planned: {Planned}, predicted: {Predicted})",
                severity, shipment.ShipmentNumber, delayMinutes,
                plannedArrival.Value, predictedArrival.Value);

            return warning;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating delay for Shipment {ShipmentId}", shipment.Id);
            return null;
        }
    }

    private static (string Severity, string SuggestedAction) ClassifyDelay(int delayMinutes) => delayMinutes switch
    {
        >= 60 => ("CRITICAL", "Musteriye bildirim gonderin, yeniden rotalama veya baska surucuye atama yapin"),
        >= 30 => ("HIGH", "Rotayi yeniden optimize edin veya musteriye bilgi verin"),
        _ => ("WARNING", "Surucuyle iletisime gecin ve durumu takip edin")
    };
}
