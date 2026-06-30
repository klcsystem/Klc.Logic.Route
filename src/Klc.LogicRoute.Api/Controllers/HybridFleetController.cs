using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Fleet;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/hybrid-fleet")]
[Authorize]
public class HybridFleetController(
    IHybridFleetService hybridFleetService,
    ICarrierNetworkRepository carrierNetworkRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>Get available capacity (own + 3P) for date and region</summary>
    [HttpGet("capacity")]
    public async Task<ActionResult<ApiResponse<FleetCapacityResult>>> GetCapacity(
        [FromQuery] DateTime date, [FromQuery] string region = "")
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await hybridFleetService.GetAvailableCapacityAsync(tenantId, date, region);
        return Ok(ApiResponse<FleetCapacityResult>.Ok(result));
    }

    /// <summary>Recommend fleet mix for a set of orders</summary>
    [HttpPost("recommend")]
    public async Task<ActionResult<ApiResponse<FleetMixRecommendation>>> Recommend([FromBody] List<FleetOrder> orders)
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await hybridFleetService.RecommendFleetMixAsync(tenantId, orders);
        return Ok(ApiResponse<FleetMixRecommendation>.Ok(result));
    }

    // --- Carrier Network CRUD ---

    /// <summary>List carrier network partners</summary>
    [HttpGet("carriers")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CarrierNetwork>>>> ListCarriers(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var carriers = await carrierNetworkRepository.GetByTenantAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<CarrierNetwork>>.Ok(carriers));
    }

    /// <summary>Get carrier by ID</summary>
    [HttpGet("carriers/{id:guid}")]
    public async Task<ActionResult<ApiResponse<CarrierNetwork>>> GetCarrier(Guid id)
    {
        var carrier = await carrierNetworkRepository.GetByIdAsync(id);
        if (carrier == null)
            return NotFound(ApiResponse<CarrierNetwork>.Fail("Carrier bulunamadi"));
        return Ok(ApiResponse<CarrierNetwork>.Ok(carrier));
    }

    /// <summary>Create a carrier network partner</summary>
    [HttpPost("carriers")]
    public async Task<ActionResult<ApiResponse<Guid>>> CreateCarrier([FromBody] CarrierNetwork carrier)
    {
        var tenantId = tenantProvider.GetTenantId();
        carrier.TenantId = tenantId;
        carrier.CreatedBy = tenantProvider.GetUserId();

        var id = await carrierNetworkRepository.InsertAsync(carrier);
        return CreatedAtAction(nameof(GetCarrier), new { id }, ApiResponse<Guid>.Ok(id));
    }

    /// <summary>Update a carrier network partner</summary>
    [HttpPut("carriers/{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateCarrier(Guid id, [FromBody] CarrierNetwork carrier)
    {
        var existing = await carrierNetworkRepository.GetByIdAsync(id);
        if (existing == null)
            return NotFound(ApiResponse<bool>.Fail("Carrier bulunamadi"));

        carrier.Id = id;
        carrier.TenantId = existing.TenantId;
        carrier.UpdatedBy = tenantProvider.GetUserId();
        await carrierNetworkRepository.UpdateAsync(carrier);
        return Ok(ApiResponse<bool>.Ok(true, "Carrier guncellendi"));
    }

    /// <summary>Delete a carrier network partner (soft delete)</summary>
    [HttpDelete("carriers/{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCarrier(Guid id)
    {
        var existing = await carrierNetworkRepository.GetByIdAsync(id);
        if (existing == null)
            return NotFound(ApiResponse<bool>.Fail("Carrier bulunamadi"));

        await carrierNetworkRepository.DeleteAsync(id);
        return Ok(ApiResponse<bool>.Ok(true, "Carrier silindi"));
    }
}
