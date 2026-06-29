using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Marketplace;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MarketplaceController(
    ICapacityListingRepository listingRepository,
    ICapacityMatchingService matchingService,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>Post available capacity</summary>
    [HttpPost("listings")]
    public async Task<ActionResult<ApiResponse<Guid>>> CreateListing([FromBody] CapacityListing listing)
    {
        var tenantId = tenantProvider.GetTenantId();
        listing.TenantId = tenantId;
        listing.CreatedBy = tenantProvider.GetUserId();
        listing.Status = CapacityListingStatus.Available;

        var id = await listingRepository.InsertAsync(listing);
        return CreatedAtAction(nameof(GetListings), null, ApiResponse<Guid>.Ok(id));
    }

    /// <summary>Browse available capacity</summary>
    [HttpGet("listings")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CapacityListing>>>> GetListings(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var listings = await listingRepository.GetAllAvailableAsync(page, pageSize);
        return Ok(ApiResponse<IEnumerable<CapacityListing>>.Ok(listings));
    }

    /// <summary>Search capacity by route and date</summary>
    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CapacityListing>>>> Search(
        [FromQuery] string? from, [FromQuery] string? to,
        [FromQuery] DateTime? date, [FromQuery] decimal? weightKg)
    {
        var results = await matchingService.FindMatchesAsync(
            from ?? "", to ?? "", date ?? DateTime.UtcNow.Date, weightKg ?? 0);
        return Ok(ApiResponse<IEnumerable<CapacityListing>>.Ok(results));
    }

    /// <summary>Request match for a listing</summary>
    [HttpPost("match/{listingId:guid}")]
    public async Task<ActionResult<ApiResponse<CapacityMatch>>> RequestMatch(Guid listingId, [FromBody] MatchRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();

        try
        {
            var match = await matchingService.RequestMatchAsync(listingId, tenantId, request.RequestedWeightKg, userId);
            return Ok(ApiResponse<CapacityMatch>.Ok(match));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<CapacityMatch>.Fail(ex.Message));
        }
    }

    /// <summary>Accept or reject a match</summary>
    [HttpPatch("match/{matchId:guid}/accept")]
    public async Task<ActionResult<ApiResponse<CapacityMatch>>> AcceptMatch(Guid matchId, [FromQuery] bool accept = true)
    {
        var tenantId = tenantProvider.GetTenantId();

        try
        {
            var match = accept
                ? await matchingService.AcceptMatchAsync(matchId, tenantId)
                : await matchingService.RejectMatchAsync(matchId, tenantId);
            return Ok(ApiResponse<CapacityMatch>.Ok(match));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<CapacityMatch>.Fail(ex.Message));
        }
    }
}

public record MatchRequest(decimal RequestedWeightKg);
