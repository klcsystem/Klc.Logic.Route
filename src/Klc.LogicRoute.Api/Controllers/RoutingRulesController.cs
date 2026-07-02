using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/routing-rules")]
[Authorize]
public class RoutingRulesController(
    IRoutingRuleRepository routingRuleRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<RoutingRule>>>> GetAll()
    {
        var tenantId = tenantProvider.GetTenantId();
        var rules = await routingRuleRepository.GetAllAsync(tenantId);
        return Ok(ApiResponse<IEnumerable<RoutingRule>>.Ok(rules));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<RoutingRule>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var rule = await routingRuleRepository.GetByIdAsync(id, tenantId);
        if (rule == null) return NotFound(ApiResponse<RoutingRule>.Fail("Kural bulunamadı"));
        return Ok(ApiResponse<RoutingRule>.Ok(rule));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] RoutingRule rule)
    {
        var tenantId = tenantProvider.GetTenantId();
        rule.TenantId = tenantId;
        rule.CreatedBy = tenantProvider.GetUserId();
        var id = await routingRuleRepository.InsertAsync(rule);
        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<Guid>.Ok(id));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid id, [FromBody] RoutingRule rule)
    {
        var tenantId = tenantProvider.GetTenantId();
        rule.Id = id;
        rule.TenantId = tenantId;
        rule.UpdatedBy = tenantProvider.GetUserId();
        await routingRuleRepository.UpdateAsync(rule);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        await routingRuleRepository.DeleteAsync(id, tenantId);
        return Ok(ApiResponse<bool>.Ok(true));
    }
}
