using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/vehicle-profiles")]
[Authorize]
public class VehicleProfileController(IVehicleProfileRepository repository, ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var profiles = await repository.GetAllAsync(tenantProvider.GetTenantId());
        return Ok(ApiResponse<List<VehicleProfile>>.Ok(profiles));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var profile = await repository.GetByIdAsync(id);
        return profile == null ? NotFound() : Ok(ApiResponse<VehicleProfile>.Ok(profile));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] VehicleProfile profile)
    {
        profile.TenantId = tenantProvider.GetTenantId();
        var id = await repository.InsertAsync(profile);
        return Ok(ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] VehicleProfile profile)
    {
        profile.Id = id;
        await repository.UpdateAsync(profile);
        return Ok(ApiResponse<string>.Ok("Updated"));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await repository.DeleteAsync(id);
        return Ok(ApiResponse<string>.Ok("Deleted"));
    }

    [HttpPost("{id:guid}/assign")]
    public async Task<IActionResult> AssignToVehicles(Guid id, [FromBody] List<Guid> vehicleIds)
    {
        await repository.AssignToVehiclesAsync(id, vehicleIds);
        return Ok(ApiResponse<string>.Ok("Assigned"));
    }
}
