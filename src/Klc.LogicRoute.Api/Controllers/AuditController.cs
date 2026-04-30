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
public class AuditController(
    IAuditLogRepository auditLogRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<AuditLog>>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var logs = await auditLogRepository.GetAllAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<AuditLog>>.Ok(logs));
    }

    [HttpGet("entity/{entityType}/{entityId:guid}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AuditLog>>>> GetByEntity(string entityType, Guid entityId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var logs = await auditLogRepository.GetByEntityAsync(entityType, entityId, tenantId);
        return Ok(ApiResponse<IEnumerable<AuditLog>>.Ok(logs));
    }
}
