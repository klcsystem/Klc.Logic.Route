using System.Security.Cryptography;
using Klc.LogicRoute.Application.CustomerEta.Services;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using MediatR;

namespace Klc.LogicRoute.Application.CustomerEta.Commands;

public record SendEtaNotificationCommand(Guid ShipmentId, Guid TenantId, string? UserId = null) : IRequest<SendEtaNotificationResult>;

public record SendEtaNotificationResult(bool Success, string? TrackingToken = null, string? Message = null);

public class SendEtaNotificationHandler(
    IShipmentRepository shipmentRepository,
    ICustomerTrackingRepository customerTrackingRepository,
    ISmsProvider smsProvider,
    IEmailProvider emailProvider,
    IEtaCalculationService etaCalculationService) : IRequestHandler<SendEtaNotificationCommand, SendEtaNotificationResult>
{
    public async Task<SendEtaNotificationResult> Handle(SendEtaNotificationCommand request, CancellationToken cancellationToken)
    {
        var shipment = await shipmentRepository.GetByIdAsync(request.ShipmentId, request.TenantId);
        if (shipment == null)
            return new SendEtaNotificationResult(false, Message: "Sevkiyat bulunamadı");

        // Get or create customer tracking record
        var tracking = await customerTrackingRepository.GetByShipmentIdAsync(request.ShipmentId, request.TenantId);
        if (tracking == null)
        {
            tracking = new CustomerTracking
            {
                TenantId = request.TenantId,
                ShipmentId = request.ShipmentId,
                TrackingToken = GenerateToken(),
                CustomerName = shipment.Notes, // Could be extended with dedicated customer fields
                IsActive = true,
                CreatedBy = request.UserId
            };

            // Calculate initial ETA if location data available
            if (shipment.CurrentLatitude.HasValue && shipment.CurrentLongitude.HasValue)
            {
                var destCoords = GetCityCoordinates(shipment.DestinationCity);
                if (destCoords != null)
                {
                    tracking.EstimatedArrival = etaCalculationService.CalculateEta(
                        (double)shipment.CurrentLatitude.Value, (double)shipment.CurrentLongitude.Value,
                        destCoords.Value.lat, destCoords.Value.lng);
                    tracking.LastEtaUpdate = DateTime.UtcNow;
                }
            }

            await customerTrackingRepository.CreateAsync(tracking);
        }

        var trackingUrl = $"https://logicroute.com/tracking/{tracking.TrackingToken}";
        var message = $"Sevkiyat takip bilgileriniz: {trackingUrl}";
        if (tracking.EstimatedArrival.HasValue)
            message += $" Tahmini varış: {tracking.EstimatedArrival.Value:dd.MM.yyyy HH:mm}";

        // Send SMS if phone available
        if (!string.IsNullOrEmpty(tracking.CustomerPhone))
            await smsProvider.SendSmsAsync(tracking.CustomerPhone, message, cancellationToken);

        // Send email if available
        if (!string.IsNullOrEmpty(tracking.CustomerEmail))
        {
            var subject = $"Sevkiyat Takip - {shipment.ShipmentNumber}";
            var body = $"<h3>Sevkiyat Takip</h3><p>{message}</p><a href='{trackingUrl}'>Takip Et</a>";
            await emailProvider.SendEmailAsync(tracking.CustomerEmail, subject, body, isHtml: true, cancellationToken);
        }

        return new SendEtaNotificationResult(true, tracking.TrackingToken, "Bildirim gönderildi");
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=')[..64];
    }

    private static (double lat, double lng)? GetCityCoordinates(string? city) => city?.ToLowerInvariant() switch
    {
        "istanbul" => (41.0082, 28.9784),
        "ankara" => (39.9334, 32.8597),
        "izmir" => (38.4192, 27.1287),
        "bursa" => (40.1827, 29.0610),
        "antalya" => (36.8969, 30.7133),
        "adana" => (36.9914, 35.3308),
        "konya" => (37.8746, 32.4932),
        "gaziantep" => (37.0662, 37.3833),
        "mersin" => (36.8121, 34.6415),
        "kayseri" => (38.7312, 35.4787),
        _ => null
    };
}
