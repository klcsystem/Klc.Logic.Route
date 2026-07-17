using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.RoutingRules;
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
    IOrderRepository orderRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<RoutingRule>>>> GetAll()
    {
        var tenantId = tenantProvider.GetTenantId();
        var rules = await routingRuleRepository.GetAllAsync(tenantId);
        return Ok(ApiResponse<IEnumerable<RoutingRule>>.Ok(rules));
    }

    /// <summary>Kuralları gerçek siparişlere karşı çalıştırır: her kurala kaç sipariş uyuyor + örnekler.
    /// Kuralların "ne işe yaradığını" somut gösterir (motor artık gerçekten çalışıyor).</summary>
    [HttpPost("evaluate")]
    public async Task<ActionResult<ApiResponse<object>>> Evaluate()
    {
        var tenantId = tenantProvider.GetTenantId();
        var rules = (await routingRuleRepository.GetAllAsync(tenantId)).Where(r => r.IsActive).OrderBy(r => r.Priority).ToList();
        var orders = (await orderRepository.GetAllAsync(tenantId, 1, 500)).ToList();

        var results = rules.Select(rule =>
        {
            var matched = orders.Where(o => RoutingRuleEngine.Matches(rule, o)).ToList();
            return new
            {
                ruleId = rule.Id,
                ruleName = rule.Name,
                action = rule.Action,
                matchCount = matched.Count,
                examples = matched.Take(3).Select(o => new
                {
                    orderNumber = o.OrderNumber,
                    route = $"{o.OriginCity} → {o.DestinationCity}",
                    weightKg = o.TotalWeightKg
                }).ToList()
            };
        }).ToList();

        return Ok(ApiResponse<object>.Ok(new
        {
            evaluatedOrders = orders.Count,
            totalMatched = results.Sum(r => r.matchCount),
            rules = results
        }));
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
