using Klc.LogicRoute.Domain.Interfaces;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Email;

public class SmtpEmailProvider : IEmailProvider
{
    private readonly ILogger<SmtpEmailProvider> _logger;
    private readonly string _smtpHost;
    private readonly int _smtpPort;
    private readonly string _username;
    private readonly string _password;
    private readonly string _fromAddress;
    private readonly string _fromName;

    public SmtpEmailProvider(IConfiguration configuration, ILogger<SmtpEmailProvider> logger)
    {
        _logger = logger;
        _smtpHost = configuration["Email:SmtpHost"] ?? "localhost";
        _smtpPort = int.TryParse(configuration["Email:SmtpPort"], out var port) ? port : 587;
        _username = configuration["Email:Username"] ?? string.Empty;
        _password = configuration["Email:Password"] ?? string.Empty;
        _fromAddress = configuration["Email:FromAddress"] ?? "noreply@logicroute.com";
        _fromName = configuration["Email:FromName"] ?? "LogicRoute";
    }

    public async Task<EmailResult> SendEmailAsync(string to, string subject, string body, bool isHtml = false, CancellationToken cancellationToken = default)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, _fromAddress));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            message.Body = new TextPart(isHtml ? "html" : "plain")
            {
                Text = body
            };

            using var client = new SmtpClient();
            await client.ConnectAsync(_smtpHost, _smtpPort, MailKit.Security.SecureSocketOptions.StartTls, cancellationToken);

            if (!string.IsNullOrEmpty(_username))
            {
                await client.AuthenticateAsync(_username, _password, cancellationToken);
            }

            var result = await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Email sent to {To}, Subject: {Subject}", to, subject);
            return new EmailResult(true, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email send failed to {To}", to);
            return new EmailResult(false, ErrorMessage: ex.Message);
        }
    }
}
