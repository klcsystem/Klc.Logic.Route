namespace Klc.LogicRoute.Domain.Interfaces;

public interface IEmailProvider
{
    Task<EmailResult> SendEmailAsync(string to, string subject, string body, bool isHtml = false, CancellationToken cancellationToken = default);
}

public record EmailResult(bool Success, string? MessageId = null, string? ErrorMessage = null);
