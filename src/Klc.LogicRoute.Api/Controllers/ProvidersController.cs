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
public class ProvidersController(
    IProviderRepository providerRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Provider>>>> GetAll()
    {
        var tenantId = tenantProvider.GetTenantId();
        var providers = await providerRepository.GetAllAsync(tenantId);
        return Ok(ApiResponse<IEnumerable<Provider>>.Ok(providers));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<Provider>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var provider = await providerRepository.GetByIdAsync(id, tenantId);
        if (provider == null) return NotFound(ApiResponse<Provider>.Fail("Tedarikçi bulunamadı"));
        return Ok(ApiResponse<Provider>.Ok(provider));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] Provider provider)
    {
        var tenantId = tenantProvider.GetTenantId();
        provider.TenantId = tenantId;
        provider.CreatedBy = tenantProvider.GetUserId();
        var id = await providerRepository.InsertAsync(provider);
        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid id, [FromBody] Provider provider)
    {
        var tenantId = tenantProvider.GetTenantId();
        provider.Id = id;
        provider.TenantId = tenantId;
        provider.UpdatedBy = tenantProvider.GetUserId();
        await providerRepository.UpdateAsync(provider);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        await providerRepository.DeleteAsync(id, tenantId);
        return Ok(ApiResponse<bool>.Ok(true));
    }
}
