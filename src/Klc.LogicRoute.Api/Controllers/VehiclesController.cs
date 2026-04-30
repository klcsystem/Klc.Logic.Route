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
public class VehiclesController(IVehicleRepository vehicleRepository, ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? providerId)
    {
        var vehicles = await vehicleRepository.GetAllAsync(tenantProvider.GetTenantId(), providerId);
        return Ok(ApiResponse<List<Vehicle>>.Ok(vehicles));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var vehicle = await vehicleRepository.GetByIdAsync(id);
        return vehicle == null ? NotFound() : Ok(ApiResponse<Vehicle>.Ok(vehicle));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Vehicle vehicle)
    {
        vehicle.TenantId = tenantProvider.GetTenantId();
        var id = await vehicleRepository.InsertAsync(vehicle);
        return Ok(ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Vehicle vehicle)
    {
        vehicle.Id = id;
        await vehicleRepository.UpdateAsync(vehicle);
        return Ok(ApiResponse<string>.Ok("Updated"));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await vehicleRepository.DeleteAsync(id);
        return Ok(ApiResponse<string>.Ok("Deleted"));
    }
}
