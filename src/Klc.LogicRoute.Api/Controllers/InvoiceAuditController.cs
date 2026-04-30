using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.InvoiceAudit;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/invoice-audits")]
[Authorize]
public class InvoiceAuditController(
    IInvoiceAuditRepository invoiceAuditRepository,
    IInvoiceAuditService invoiceAuditService,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<InvoiceAudit>>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var audits = await invoiceAuditRepository.GetAllAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<InvoiceAudit>>.Ok(audits));
    }

    [HttpPost("audit")]
    public async Task<ActionResult<ApiResponse<InvoiceAudit>>> Audit([FromBody] InvoiceAuditRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await invoiceAuditService.AuditAsync(request.ShipmentId, request.InvoiceNumber, request.InvoiceAmount, tenantId);
        return Ok(ApiResponse<InvoiceAudit>.Ok(result));
    }

    [HttpPatch("{id:guid}/review")]
    public async Task<ActionResult<ApiResponse<bool>>> Review(Guid id, [FromBody] InvoiceReviewRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        await invoiceAuditRepository.UpdateStatusAsync(id, tenantId, request.Status, request.Notes, tenantProvider.GetUserId());
        return Ok(ApiResponse<bool>.Ok(true));
    }
}

public record InvoiceAuditRequest(Guid ShipmentId, string InvoiceNumber, decimal InvoiceAmount);
public record InvoiceReviewRequest(string Status, string? Notes);
