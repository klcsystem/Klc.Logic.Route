using System.Net.Http.Json;
using System.Web;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Sms;

public class NetGsmSmsProvider : ISmsProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NetGsmSmsProvider> _logger;
    private readonly string _userCode;
    private readonly string _password;
    private readonly string _originator;

    public NetGsmSmsProvider(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<NetGsmSmsProvider> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _userCode = configuration["Sms:NetGsm:UserCode"] ?? string.Empty;
        _password = configuration["Sms:NetGsm:Password"] ?? string.Empty;
        _originator = configuration["Sms:NetGsm:Originator"] ?? string.Empty;
    }

    public async Task<SmsResult> SendSmsAsync(string phoneNumber, string message, CancellationToken cancellationToken = default)
    {
        try
        {
            var queryParams = new Dictionary<string, string>
            {
                ["usercode"] = _userCode,
                ["password"] = _password,
                ["gsmno"] = phoneNumber,
                ["message"] = message,
                ["msgheader"] = _originator,
                ["dil"] = "TR"
            };

            var queryString = string.Join("&",
                queryParams.Select(kv => $"{kv.Key}={HttpUtility.UrlEncode(kv.Value)}"));

            var response = await _httpClient.GetAsync(
                $"https://api.netgsm.com.tr/sms/send/get/?{queryString}",
                cancellationToken);

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            // NetGSM returns codes: 00 = success, 20 = message too long, 30 = invalid credentials, etc.
            if (responseBody.StartsWith("00"))
            {
                var parts = responseBody.Split(' ');
                var messageId = parts.Length > 1 ? parts[1] : null;
                _logger.LogInformation("SMS sent successfully to {PhoneNumber}, MessageId: {MessageId}", phoneNumber, messageId);
                return new SmsResult(true, messageId);
            }

            _logger.LogWarning("SMS send failed to {PhoneNumber}. Response: {Response}", phoneNumber, responseBody);
            return new SmsResult(false, ErrorMessage: $"NetGSM error: {responseBody}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS send exception for {PhoneNumber}", phoneNumber);
            return new SmsResult(false, ErrorMessage: ex.Message);
        }
    }
}
