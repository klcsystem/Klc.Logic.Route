using Klc.LogicRoute.Application.Prediction.Models;

namespace Klc.LogicRoute.Application.Prediction;

public interface INdrPredictionService
{
    /// <summary>
    /// Calculates NDR (Non-Delivery Report) risk score for a single order.
    /// </summary>
    Task<NdrRiskScore> PredictAsync(Guid orderId, Guid tenantId);

    /// <summary>
    /// Batch NDR risk analysis for multiple orders.
    /// </summary>
    Task<NdrBatchResult> PredictBatchAsync(List<Guid> orderIds, Guid tenantId);
}
