using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.ML.Pipeline;
using Klc.LogicRoute.Application.ML.Services;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/ml")]
[Authorize]
public class MLController(
    IMLPredictionService predictionService,
    IMLModelRepository modelRepository,
    IShipmentRepository shipmentRepository,
    ModelTrainingJob trainingJob,
    ITenantProvider tenantProvider) : ControllerBase
{
    [HttpGet("predictions/delivery-time")]
    public async Task<ActionResult<ApiResponse<DeliveryTimePrediction>>> PredictDeliveryTime([FromQuery] Guid shipmentId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipment = await shipmentRepository.GetByIdAsync(shipmentId, tenantId);
        if (shipment == null)
            return NotFound(ApiResponse<DeliveryTimePrediction>.Fail("Sevkiyat bulunamadi"));

        var result = await predictionService.PredictDeliveryTimeAsync(shipment, tenantId);
        return Ok(ApiResponse<DeliveryTimePrediction>.Ok(result));
    }

    [HttpGet("predictions/delay-risk")]
    public async Task<ActionResult<ApiResponse<DelayRiskPrediction>>> PredictDelayRisk([FromQuery] Guid shipmentId)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipment = await shipmentRepository.GetByIdAsync(shipmentId, tenantId);
        if (shipment == null)
            return NotFound(ApiResponse<DelayRiskPrediction>.Fail("Sevkiyat bulunamadi"));

        var result = await predictionService.PredictDelayRiskAsync(shipment, tenantId);
        return Ok(ApiResponse<DelayRiskPrediction>.Ok(result));
    }

    [HttpPost("training/trigger")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<string>>> TriggerTraining()
    {
        _ = Task.Run(() => trainingJob.TrainModelsAsync(CancellationToken.None));
        return Ok(ApiResponse<string>.Ok("Model egitimi baslatildi"));
    }

    [HttpGet("models")]
    public async Task<ActionResult<ApiResponse<IEnumerable<MLModelMetadata>>>> GetModels()
    {
        var tenantId = tenantProvider.GetTenantId();
        var models = await modelRepository.GetAllAsync(tenantId);
        return Ok(ApiResponse<IEnumerable<MLModelMetadata>>.Ok(models));
    }
}
