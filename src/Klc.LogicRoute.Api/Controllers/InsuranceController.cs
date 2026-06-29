using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Insurance;
using Klc.LogicRoute.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InsuranceController(
    IInsuranceService insuranceService,
    IRiskScoringService riskScoringService,
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
        return Ok(ApiResponse<IEnumerable<InsuranceQuote>>.Ok(quotes, $"{quotes.Count()} partner'a teklif talebi gonderildi"));
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
            return Ok(ApiResponse<InsurancePolicy>.Ok(policy, "Police olusturuldu"));
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
            return Unauthorized(ApiResponse<IEnumerable<InsuranceQuote>>.Fail("API anahtari gerekli"));

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
            return Unauthorized(ApiResponse<InsuranceQuote>.Fail("API anahtari gerekli"));

        try
        {
            var quote = await insuranceService.SubmitPartnerQuoteAsync(submission);
            return Ok(ApiResponse<InsuranceQuote>.Ok(quote, "Teklif basariyla gonderildi"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<InsuranceQuote>.Fail(ex.Message));
        }
    }
}
