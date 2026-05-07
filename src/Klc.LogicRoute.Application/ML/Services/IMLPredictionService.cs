using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Application.ML.Services;

public interface IMLPredictionService
{
    Task<DeliveryTimePrediction> PredictDeliveryTimeAsync(Shipment shipment, Guid tenantId, CancellationToken cancellationToken = default);
    Task<DelayRiskPrediction> PredictDelayRiskAsync(Shipment shipment, Guid tenantId, CancellationToken cancellationToken = default);
    Task<CostAnomalyResult> DetectCostAnomalyAsync(decimal cost, Guid tenantId, CancellationToken cancellationToken = default);
}

public record DeliveryTimePrediction(double PredictedHours, double Confidence, string ModelVersion);
public record DelayRiskPrediction(bool IsDelayed, double Probability, string ModelVersion);
public record CostAnomalyResult(bool IsAnomaly, double ZScore, double Mean, double StdDev);
