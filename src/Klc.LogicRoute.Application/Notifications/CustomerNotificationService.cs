using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Notifications;

public class CustomerNotificationService(
    INotificationTemplateRepository templateRepository,
    ISmsProvider smsProvider,
    IEmailProvider emailProvider,
    ILogger<CustomerNotificationService> logger) : ICustomerNotificationService
{
    private static readonly Dictionary<DeliveryNotificationStage, string> DefaultSmsTemplates = new()
    {
        [DeliveryNotificationStage.OrderConfirmed] = "Siparişiniz onaylandı. Takip: {TrackingUrl}",
        [DeliveryNotificationStage.OutForDelivery] = "Kargonuz yola çıktı, tahmini varış: {ETA}. Takip: {TrackingUrl}",
        [DeliveryNotificationStage.Approaching] = "Kargonuz {MinutesLeft} dk sonra teslim edilecek.",
        [DeliveryNotificationStage.Delivered] = "Kargonuz teslim edildi. Değerlendirmenizi bekliyoruz: {FeedbackUrl}",
        [DeliveryNotificationStage.FailedAttempt] = "Teslimat yapılamadı, yeniden randevu alın: {RescheduleUrl}"
    };

    private static readonly Dictionary<DeliveryNotificationStage, string> DefaultEmailSubjects = new()
    {
        [DeliveryNotificationStage.OrderConfirmed] = "Siparişiniz Onaylandı",
        [DeliveryNotificationStage.OutForDelivery] = "Kargonuz Yola Çıktı",
        [DeliveryNotificationStage.Approaching] = "Kargonuz Yaklasıyor",
        [DeliveryNotificationStage.Delivered] = "Kargonuz Teslim Edildi",
        [DeliveryNotificationStage.FailedAttempt] = "Teslimat Yapılamadı"
    };

    private static readonly Dictionary<DeliveryNotificationStage, string> DefaultEmailTemplates = new()
    {
        [DeliveryNotificationStage.OrderConfirmed] =
            "Sayın {CustomerName},\n\nSiparişiniz onaylandı ve hazırlanıyor.\nTakip linki: {TrackingUrl}\n\nTeşekkürler.",
        [DeliveryNotificationStage.OutForDelivery] =
            "Sayın {CustomerName},\n\nKargonuz yola çıktı.\nTahmini varış saati: {ETA}\nTakip: {TrackingUrl}\n\nTeşekkürler.",
        [DeliveryNotificationStage.Approaching] =
            "Sayın {CustomerName},\n\nKargonuz yaklaşık {MinutesLeft} dakika sonra teslim edilecek.\nLütfen hazır olun.\n\nTeşekkürler.",
        [DeliveryNotificationStage.Delivered] =
            "Sayın {CustomerName},\n\nKargonuz başarıyla teslim edildi.\nDeneyiminizi değerlendirin: {FeedbackUrl}\n\nTeşekkürler.",
        [DeliveryNotificationStage.FailedAttempt] =
            "Sayın {CustomerName},\n\nTeslimat yapılamadı.\nYeni randevu almak için: {RescheduleUrl}\n\nTeşekkürler."
    };

    public async Task SendDeliveryNotificationAsync(Guid tenantId, DeliveryNotificationStage stage,
        Dictionary<string, string> variables, string? phoneNumber = null, string? email = null,
        CancellationToken cancellationToken = default)
    {
        if (phoneNumber != null)
        {
            await SendViaSmsAsync(tenantId, stage, variables, phoneNumber, cancellationToken);
        }

        if (email != null)
        {
            await SendViaEmailAsync(tenantId, stage, variables, email, cancellationToken);
        }
    }

    private async Task SendViaSmsAsync(Guid tenantId, DeliveryNotificationStage stage,
        Dictionary<string, string> variables, string phoneNumber, CancellationToken cancellationToken)
    {
        try
        {
            var template = await templateRepository.GetByStageAndChannelAsync(tenantId, stage, NotificationChannel.Sms);
            var body = template?.TemplateBody ?? DefaultSmsTemplates.GetValueOrDefault(stage, string.Empty);
            var message = SubstituteVariables(body, variables);

            var result = await smsProvider.SendSmsAsync(phoneNumber, message, cancellationToken);
            if (!result.Success)
            {
                logger.LogWarning("SMS notification failed for stage {Stage} to {Phone}: {Error}",
                    stage, phoneNumber, result.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending SMS notification for stage {Stage} to {Phone}", stage, phoneNumber);
        }
    }

    private async Task SendViaEmailAsync(Guid tenantId, DeliveryNotificationStage stage,
        Dictionary<string, string> variables, string email, CancellationToken cancellationToken)
    {
        try
        {
            var template = await templateRepository.GetByStageAndChannelAsync(tenantId, stage, NotificationChannel.Email);
            var subject = template?.Subject ?? DefaultEmailSubjects.GetValueOrDefault(stage, "Bildirim");
            var body = template?.TemplateBody ?? DefaultEmailTemplates.GetValueOrDefault(stage, string.Empty);
            var message = SubstituteVariables(body, variables);
            var subjectResolved = SubstituteVariables(subject, variables);

            var result = await emailProvider.SendEmailAsync(email, subjectResolved, message, false, cancellationToken);
            if (!result.Success)
            {
                logger.LogWarning("Email notification failed for stage {Stage} to {Email}: {Error}",
                    stage, email, result.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending email notification for stage {Stage} to {Email}", stage, email);
        }
    }

    private static string SubstituteVariables(string template, Dictionary<string, string> variables)
    {
        var result = template;
        foreach (var kvp in variables)
        {
            result = result.Replace($"{{{kvp.Key}}}", kvp.Value);
        }
        return result;
    }
}
