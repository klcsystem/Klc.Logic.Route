using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReturnsController(IReturnRequestRepository returnRequestRepository, ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var returns = await returnRequestRepository.GetAllAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<List<ReturnRequest>>.Ok(returns));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var returnRequest = await returnRequestRepository.GetByIdAsync(id, tenantId);
        return returnRequest == null
            ? NotFound(ApiResponse<ReturnRequest>.Fail("İade talebi bulunamadı"))
            : Ok(ApiResponse<ReturnRequest>.Ok(returnRequest));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ReturnRequest returnRequest)
    {
        var tenantId = tenantProvider.GetTenantId();
        returnRequest.TenantId = tenantId;
        returnRequest.CreatedBy = tenantProvider.GetUserId();
        returnRequest.Status = ReturnStatus.Requested;
        var id = await returnRequestRepository.InsertAsync(returnRequest);
        return Ok(ApiResponse<Guid>.Ok(id));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateReturnStatusRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var existing = await returnRequestRepository.GetByIdAsync(id, tenantId);
        if (existing == null)
            return NotFound(ApiResponse<string>.Fail("İade talebi bulunamadı"));

        DateTime? receivedAt = request.Status == ReturnStatus.Received ? DateTime.UtcNow : null;
        await returnRequestRepository.UpdateStatusAsync(id, tenantId, request.Status.ToString(), receivedAt);
        return Ok(ApiResponse<string>.Ok("Status updated"));
    }
}

public class UpdateReturnStatusRequest
{
    public ReturnStatus Status { get; set; }
}
