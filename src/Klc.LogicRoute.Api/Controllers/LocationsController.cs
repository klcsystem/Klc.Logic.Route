using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LocationsController(
    ILocationRepository locationRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Location>>>> GetAll()
    {
        var tenantId = tenantProvider.GetTenantId();
        var locations = await locationRepository.GetAllAsync(tenantId);
        return Ok(ApiResponse<List<Location>>.Ok(locations));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<Location>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var location = await locationRepository.GetByIdAsync(id, tenantId);
        if (location == null)
            return NotFound(ApiResponse<Location>.Fail("Lokasyon bulunamadi"));
        return Ok(ApiResponse<Location>.Ok(location));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] Location location)
    {
        var tenantId = tenantProvider.GetTenantId();
        location.TenantId = tenantId;
        location.CreatedBy = tenantProvider.GetUserId();
        var id = await locationRepository.InsertAsync(location);
        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid id, [FromBody] Location location)
    {
        var tenantId = tenantProvider.GetTenantId();
        var existing = await locationRepository.GetByIdAsync(id, tenantId);
        if (existing == null)
            return NotFound(ApiResponse<bool>.Fail("Lokasyon bulunamadi"));

        location.Id = id;
        location.TenantId = tenantId;
        location.UpdatedBy = tenantProvider.GetUserId();
        await locationRepository.UpdateAsync(location);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var existing = await locationRepository.GetByIdAsync(id, tenantId);
        if (existing == null)
            return NotFound(ApiResponse<bool>.Fail("Lokasyon bulunamadi"));

        await locationRepository.DeleteAsync(id, tenantId);
        return Ok(ApiResponse<bool>.Ok(true));
    }
}
