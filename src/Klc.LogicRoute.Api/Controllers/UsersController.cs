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
public class UsersController(
    IUserRepository userRepository,
    IRoleRepository roleRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<User>>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var users = await userRepository.GetAllAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<User>>.Ok(users));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<User>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var user = await userRepository.GetByIdAsync(id, tenantId);
        if (user == null) return NotFound(ApiResponse<User>.Fail("Kullanıcı bulunamadı"));
        return Ok(ApiResponse<User>.Ok(user));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid id, [FromBody] User user)
    {
        var tenantId = tenantProvider.GetTenantId();
        user.Id = id;
        user.TenantId = tenantId;
        await userRepository.UpdateAsync(user);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        await userRepository.DeleteAsync(id, tenantId);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpGet("count")]
    public async Task<ActionResult<ApiResponse<int>>> GetCount()
    {
        var tenantId = tenantProvider.GetTenantId();
        var count = await userRepository.GetCountAsync(tenantId);
        return Ok(ApiResponse<int>.Ok(count));
    }

    [HttpGet("roles")]
    public async Task<ActionResult<ApiResponse<IEnumerable<OperationClaim>>>> GetRoles()
    {
        var tenantId = tenantProvider.GetTenantId();
        var roles = await roleRepository.GetAllAsync(tenantId);
        return Ok(ApiResponse<IEnumerable<OperationClaim>>.Ok(roles));
    }
}
