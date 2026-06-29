using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.Prediction;
using Klc.LogicRoute.Application.Prediction.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/prediction")]
[Authorize]
public class PredictionController(
    INdrPredictionService ndrPredictionService,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet("ndr-risk/{orderId:guid}")]
    public async Task<ActionResult<ApiResponse<NdrRiskScore>>> GetNdrRisk(Guid orderId)
    {
        var tenantId = tenantProvider.GetTenantId();

        try
        {
            var result = await ndrPredictionService.PredictAsync(orderId, tenantId);
            return Ok(ApiResponse<NdrRiskScore>.Ok(result));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<NdrRiskScore>.Fail(ex.Message));
        }
    }

    [HttpPost("ndr-batch")]
    public async Task<ActionResult<ApiResponse<NdrBatchResult>>> BatchNdrAnalysis(
        [FromBody] NdrBatchRequest request)
    {
        if (request.OrderIds.Count == 0)
            return BadRequest(ApiResponse<NdrBatchResult>.Fail("En az bir siparis ID gereklidir."));

        if (request.OrderIds.Count > 100)
            return BadRequest(ApiResponse<NdrBatchResult>.Fail("Tek seferde en fazla 100 siparis analiz edilebilir."));

        var tenantId = tenantProvider.GetTenantId();
        var result = await ndrPredictionService.PredictBatchAsync(request.OrderIds, tenantId);
        return Ok(ApiResponse<NdrBatchResult>.Ok(result));
    }
}
