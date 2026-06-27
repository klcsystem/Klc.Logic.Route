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
        [DeliveryNotificationStage.OrderConfirmed] = "Siparissiniz onaylandi. Takip: {TrackingUrl}",
        [DeliveryNotificationStage.OutForDelivery] = "Kargonuz yola cikti, tahmini varis: {ETA}. Takip: {TrackingUrl}",
        [DeliveryNotificationStage.Approaching] = "Kargonuz {MinutesLeft} dk sonra teslim edilecek.",
        [DeliveryNotificationStage.Delivered] = "Kargonuz teslim edildi. Degerlendirmenizi bekliyoruz: {FeedbackUrl}",
        [DeliveryNotificationStage.FailedAttempt] = "Teslimat yapilamadi, yeniden randevu alin: {RescheduleUrl}"
    };

    private static readonly Dictionary<DeliveryNotificationStage, string> DefaultEmailSubjects = new()
    {
        [DeliveryNotificationStage.OrderConfirmed] = "Siparissiniz Onaylandi",
        [DeliveryNotificationStage.OutForDelivery] = "Kargonuz Yola Cikti",
        [DeliveryNotificationStage.Approaching] = "Kargonuz Yaklasıyor",
        [DeliveryNotificationStage.Delivered] = "Kargonuz Teslim Edildi",
        [DeliveryNotificationStage.FailedAttempt] = "Teslimat Yapilamadi"
    };

    private static readonly Dictionary<DeliveryNotificationStage, string> DefaultEmailTemplates = new()
    {
        [DeliveryNotificationStage.OrderConfirmed] =
            "Sayin {CustomerName},\n\nSiparissiniz onaylandi ve hazirlaniyor.\nTakip linki: {TrackingUrl}\n\nTesekkurler.",
        [DeliveryNotificationStage.OutForDelivery] =
            "Sayin {CustomerName},\n\nKargonuz yola cikti.\nTahmini varis saati: {ETA}\nTakip: {TrackingUrl}\n\nTesekkurler.",
        [DeliveryNotificationStage.Approaching] =
            "Sayin {CustomerName},\n\nKargonuz yaklasik {MinutesLeft} dakika sonra teslim edilecek.\nLutfen hazir olun.\n\nTesekkurler.",
        [DeliveryNotificationStage.Delivered] =
            "Sayin {CustomerName},\n\nKargonuz basariyla teslim edildi.\nDeneyiminizi degerlendirin: {FeedbackUrl}\n\nTesekkurler.",
        [DeliveryNotificationStage.FailedAttempt] =
            "Sayin {CustomerName},\n\nTeslimat yapilamadi.\nYeni randevu almak icin: {RescheduleUrl}\n\nTesekkurler."
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
