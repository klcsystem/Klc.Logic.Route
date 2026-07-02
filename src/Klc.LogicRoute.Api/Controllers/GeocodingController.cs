using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GeocodingController(IGeocodingProvider geocodingProvider) : ControllerBase
{
    /// <summary>
    /// GET /api/geocoding/search?query=Kadikoy+Istanbul
    /// Returns top 5 geocoding results: { lat, lng, displayName }
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<GeocodingSearchDto>>>> Search(
        [FromQuery] string query,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest(ApiResponse<List<GeocodingSearchDto>>.Fail("Adres boş olamaz"));

        var results = await geocodingProvider.SearchAsync(query, 5, cancellationToken);
        if (results.Count == 0)
            return Ok(ApiResponse<List<GeocodingSearchDto>>.Ok([]));

        var dtos = results.Select(r => new GeocodingSearchDto(r.Latitude, r.Longitude, r.DisplayName)).ToList();
        return Ok(ApiResponse<List<GeocodingSearchDto>>.Ok(dtos));
    }

    /// <summary>
    /// GET /api/geocoding/reverse?lat=41.0082&lng=28.9784
    /// Returns structured address: { address, city, district, displayName }
    /// </summary>
    [HttpGet("reverse")]
    public async Task<ActionResult<ApiResponse<GeocodingReverseDto>>> Reverse(
        [FromQuery] double lat,
        [FromQuery] double lng,
        CancellationToken cancellationToken)
    {
        var result = await geocodingProvider.ReverseGeocodeAsync(lat, lng, cancellationToken);
        if (result == null)
            return NotFound(ApiResponse<GeocodingReverseDto>.Fail("Konum için adres bulunamadı"));

        var dto = new GeocodingReverseDto(result.Address, result.City, result.District, result.DisplayName);
        return Ok(ApiResponse<GeocodingReverseDto>.Ok(dto));
    }
}

public record GeocodingSearchDto(double Lat, double Lng, string? DisplayName);
public record GeocodingReverseDto(string? Address, string? City, string? District, string? DisplayName);
