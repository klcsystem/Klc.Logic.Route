namespace Klc.LogicRoute.Domain.Interfaces;

public interface ISmsProvider
{
    Task<SmsResult> SendSmsAsync(string phoneNumber, string message, CancellationToken cancellationToken = default);
}

public record SmsResult(bool Success, string? MessageId = null, string? ErrorMessage = null);
