using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/optimization-presets")]
[Authorize]
public class OptimizationPresetController(IOptimizationPresetRepository repository, ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var presets = await repository.GetAllAsync(tenantProvider.GetTenantId());
        return Ok(ApiResponse<List<OptimizationPreset>>.Ok(presets));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var preset = await repository.GetByIdAsync(id);
        return preset == null ? NotFound() : Ok(ApiResponse<OptimizationPreset>.Ok(preset));
    }

    [HttpGet("default")]
    public async Task<IActionResult> GetDefault()
    {
        var preset = await repository.GetDefaultAsync(tenantProvider.GetTenantId());
        return preset == null ? NotFound() : Ok(ApiResponse<OptimizationPreset>.Ok(preset));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OptimizationPreset preset)
    {
        preset.TenantId = tenantProvider.GetTenantId();
        var id = await repository.InsertAsync(preset);
        return Ok(ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] OptimizationPreset preset)
    {
        preset.Id = id;
        await repository.UpdateAsync(preset);
        return Ok(ApiResponse<string>.Ok("Updated"));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await repository.DeleteAsync(id);
        return Ok(ApiResponse<string>.Ok("Deleted"));
    }
}
