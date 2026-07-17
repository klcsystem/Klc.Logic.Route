using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Insurance;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InsuranceController(
    IInsuranceService insuranceService,
    IRiskScoringService riskScoringService,
    IJwtTokenService jwtTokenService,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>Request quotes from all active insurance partners</summary>
    [HttpPost("request-quotes")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<InsuranceQuote>>>> RequestQuotes([FromBody] QuoteRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();

        var quotes = await insuranceService.RequestQuotesAsync(request, tenantId, userId);
        return Ok(ApiResponse<IEnumerable<InsuranceQuote>>.Ok(quotes, $"{quotes.Count()} partner'a teklif talebi gönderildi"));
    }

    /// <summary>Aktif sigorta partnerleri (kimler teklif verecek) — nakliyeci gösterir</summary>
    [HttpGet("partners")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetPartners()
    {
        var partners = await insuranceService.GetActivePartnersAsync();
        return Ok(ApiResponse<object>.Ok(partners.Select(p => new { id = p.Id, name = p.Name, hasApi = p.HasApi, commissionPercent = p.CommissionPercent })));
    }

    /// <summary>Tüm teklifler (tenant) — partner adı + sevkiyat detaylarıyla; nakliyeci dönen teklifleri görür</summary>
    [HttpGet("quotes")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<BrokerQuoteView>>>> GetAllQuotes()
    {
        var tenantId = tenantProvider.GetTenantId();
        var views = await insuranceService.GetTenantQuoteViewsAsync(tenantId);
        return Ok(ApiResponse<IEnumerable<BrokerQuoteView>>.Ok(views));
    }

    /// <summary>List quotes for a shipment</summary>
    [HttpGet("quotes/{shipmentId:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<InsuranceQuote>>>> GetQuotes(Guid shipmentId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var quotes = await insuranceService.GetQuotesAsync(shipmentId, tenantId);
        return Ok(ApiResponse<IEnumerable<InsuranceQuote>>.Ok(quotes));
    }

    /// <summary>Accept a quote and create policy</summary>
    [HttpPost("accept/{quoteId:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<InsurancePolicy>>> AcceptQuote(Guid quoteId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();

        try
        {
            var policy = await insuranceService.AcceptQuoteAsync(quoteId, tenantId, userId);
            return Ok(ApiResponse<InsurancePolicy>.Ok(policy, "Poliçe oluşturuldu"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<InsurancePolicy>.Fail(ex.Message));
        }
    }

    /// <summary>List active policies</summary>
    [HttpGet("policies")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<InsurancePolicy>>>> GetPolicies(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var policies = await insuranceService.GetPoliciesAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<InsurancePolicy>>.Ok(policies));
    }

    /// <summary>Calculate risk score for a shipment</summary>
    [HttpPost("risk-score")]
    [Authorize]
    public ActionResult<ApiResponse<RiskAssessment>> CalculateRisk([FromBody] RiskInput input)
    {
        var assessment = riskScoringService.CalculateRisk(input);
        return Ok(ApiResponse<RiskAssessment>.Ok(assessment));
    }

    // =====================================================
    // Broker Panel — AllowAnonymous with API key auth
    // =====================================================

    /// <summary>Broker: get pending quote requests</summary>
    [HttpGet("partner/requests")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IEnumerable<InsuranceQuote>>>> GetPartnerRequests([FromQuery] string apiKey)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return Unauthorized(ApiResponse<IEnumerable<InsuranceQuote>>.Fail("API anahtarı gerekli"));

        try
        {
            var quotes = await insuranceService.GetPendingRequestsForPartnerAsync(apiKey);
            return Ok(ApiResponse<IEnumerable<InsuranceQuote>>.Ok(quotes));
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(ApiResponse<IEnumerable<InsuranceQuote>>.Fail(ex.Message));
        }
    }

    /// <summary>Broker: submit a quote price</summary>
    [HttpPost("partner/submit-quote")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<InsuranceQuote>>> SubmitPartnerQuote([FromBody] PartnerQuoteSubmission submission)
    {
        if (string.IsNullOrWhiteSpace(submission.ApiKey))
            return Unauthorized(ApiResponse<InsuranceQuote>.Fail("API anahtarı gerekli"));

        try
        {
            var quote = await insuranceService.SubmitPartnerQuoteAsync(submission);
            return Ok(ApiResponse<InsuranceQuote>.Ok(quote, "Teklif başarıyla gönderildi"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<InsuranceQuote>.Fail(ex.Message));
        }
    }

    // ══════════════════ BROKER PORTALI (bireysel, hesap verebilir kullanıcılar) ══════════════════

    public record BrokerLoginRequest(string Email, string Password);
    public record BrokerSubmitRequest(Guid QuoteId, decimal PremiumAmount, DateTime? ValidUntil);
    public record CreateBrokerUserRequest(Guid PartnerId, string FullName, string Email, string Password);

    /// <summary>Broker kullanıcısı girişi (e-posta/şifre) → JWT</summary>
    [HttpPost("broker/login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> BrokerLogin([FromBody] BrokerLoginRequest req)
    {
        var result = await insuranceService.BrokerLoginAsync(req.Email, req.Password);
        if (result == null)
            return Unauthorized(ApiResponse<object>.Fail("E-posta veya şifre hatalı"));

        var token = jwtTokenService.GenerateBrokerToken(
            result.User.Id, result.User.FullName, result.User.Email, result.User.PartnerId, result.User.TenantId);

        return Ok(ApiResponse<object>.Ok(new
        {
            token,
            name = result.User.FullName,
            email = result.User.Email,
            partnerName = result.PartnerName,
        }));
    }

    /// <summary>Broker'ın partneri için tüm teklifler (bekleyen + verilen), sevkiyat detaylarıyla</summary>
    [HttpGet("broker/quotes")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<BrokerQuoteView>>>> BrokerQuotes()
    {
        if (!TryGetBrokerPartner(out var partnerId, out _, out _))
            return Forbid();
        var views = await insuranceService.GetPartnerQuoteViewsAsync(partnerId);
        return Ok(ApiResponse<IEnumerable<BrokerQuoteView>>.Ok(views));
    }

    /// <summary>Broker teklif verir — kim verdiği kaydedilir</summary>
    [HttpPost("broker/submit-quote")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<InsuranceQuote>>> BrokerSubmitQuote([FromBody] BrokerSubmitRequest req)
    {
        if (!TryGetBrokerPartner(out var partnerId, out var brokerId, out var brokerName))
            return Forbid();
        try
        {
            var validUntil = req.ValidUntil ?? DateTime.UtcNow.AddDays(7);
            var quote = await insuranceService.SubmitQuoteByBrokerAsync(partnerId, brokerId, brokerName, req.QuoteId, req.PremiumAmount, validUntil);
            return Ok(ApiResponse<InsuranceQuote>.Ok(quote, "Teklif gönderildi"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<InsuranceQuote>.Fail(ex.Message));
        }
    }

    /// <summary>Admin: broker kullanıcısı oluşturur (Kronos çalışanı ekleme)</summary>
    [HttpPost("broker/users")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> CreateBrokerUser([FromBody] CreateBrokerUserRequest req)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();
        try
        {
            var user = await insuranceService.CreateBrokerUserAsync(req.PartnerId, req.FullName, req.Email, req.Password, tenantId, userId);
            return Ok(ApiResponse<object>.Ok(new { user.Id, user.FullName, user.Email }, "Broker kullanıcısı oluşturuldu"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    // JWT claim'lerinden broker kimliğini çöz (broker olmayan token'lar için false)
    private bool TryGetBrokerPartner(out Guid partnerId, out Guid brokerId, out string brokerName)
    {
        partnerId = Guid.Empty; brokerId = Guid.Empty; brokerName = "";
        var pid = User.FindFirst("partner_id")?.Value;
        var bid = User.FindFirst("broker_id")?.Value;
        brokerName = User.FindFirst("name")?.Value ?? "Broker";
        return Guid.TryParse(pid, out partnerId) && Guid.TryParse(bid, out brokerId);
    }
}
