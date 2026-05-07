using System.Text.Json;
using Klc.LogicRoute.Application.ML.Pipeline;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.ML;

namespace Klc.LogicRoute.Application.ML.Services;

public class DeliveryTimePredictionService : IMLPredictionService
{
    private readonly IMLModelRepository _modelRepository;
    private readonly IPredictionLogRepository _predictionLogRepository;
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ILogger<DeliveryTimePredictionService> _logger;
    private readonly MLContext _mlContext;

    public DeliveryTimePredictionService(
        IMLModelRepository modelRepository,
        IPredictionLogRepository predictionLogRepository,
        IShipmentRepository shipmentRepository,
        ILogger<DeliveryTimePredictionService> logger)
    {
        _modelRepository = modelRepository;
        _predictionLogRepository = predictionLogRepository;
        _shipmentRepository = shipmentRepository;
        _logger = logger;
        _mlContext = new MLContext(seed: 42);
    }

    public async Task<DeliveryTimePrediction> PredictDeliveryTimeAsync(Shipment shipment, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var features = FeatureExtractor.Extract(shipment);
        var activeModel = await _modelRepository.GetActiveModelAsync("DeliveryTime", tenantId);

        double predictedHours;
        double confidence;
        string modelVersion;

        if (activeModel?.FilePath != null && File.Exists(activeModel.FilePath))
        {
            try
            {
                var model = _mlContext.Model.Load(activeModel.FilePath, out _);
                var engine = _mlContext.Model.CreatePredictionEngine<ShipmentFeatures, DeliveryTimePredictionOutput>(model);
                var prediction = engine.Predict(features);
                predictedHours = Math.Max(1, prediction.DeliveryHours);
                confidence = 0.85;
                modelVersion = activeModel.ModelVersion;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "ML model prediction failed, using heuristic fallback");
                predictedHours = HeuristicPredict(shipment);
                confidence = 0.5;
                modelVersion = "heuristic";
            }
        }
        else
        {
            predictedHours = HeuristicPredict(shipment);
            confidence = 0.5;
            modelVersion = "heuristic";
        }

        // Log prediction
        await _predictionLogRepository.CreateAsync(new PredictionLog
        {
            TenantId = tenantId,
            ModelId = activeModel?.Id,
            ModelType = "DeliveryTime",
            InputFeatures = JsonSerializer.Serialize(features),
            PredictedValue = predictedHours,
            PredictionAt = DateTime.UtcNow
        });

        return new DeliveryTimePrediction(Math.Round(predictedHours, 1), confidence, modelVersion);
    }

    public async Task<DelayRiskPrediction> PredictDelayRiskAsync(Shipment shipment, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var features = FeatureExtractor.Extract(shipment);

        // Heuristic delay risk based on features
        var riskScore = 0.0;
        if (shipment.IsHazardous) riskScore += 0.15;
        if (shipment.RequiresColdChain) riskScore += 0.10;
        if (shipment.Priority == Domain.Enums.ShipmentPriority.Urgent) riskScore += 0.05;
        if (features.DayOfWeek is 0 or 6) riskScore += 0.10; // weekend
        if (features.Hour < 6 || features.Hour > 20) riskScore += 0.05; // off-hours
        if (features.Weight > 10000) riskScore += 0.10;

        // Base delay rate
        riskScore += 0.15;
        riskScore = Math.Min(riskScore, 0.95);

        var isDelayed = riskScore > 0.5;

        await _predictionLogRepository.CreateAsync(new PredictionLog
        {
            TenantId = tenantId,
            ModelType = "DelayRisk",
            InputFeatures = JsonSerializer.Serialize(features),
            PredictedValue = riskScore,
            PredictionAt = DateTime.UtcNow
        });

        return new DelayRiskPrediction(isDelayed, Math.Round(riskScore, 3), "heuristic-v1");
    }

    public async Task<CostAnomalyResult> DetectCostAnomalyAsync(decimal cost, Guid tenantId, CancellationToken cancellationToken = default)
    {
        // Get recent shipment costs for z-score calculation
        var shipments = await _shipmentRepository.GetAllAsync(tenantId, 1, 200);
        var costs = shipments
            .Where(s => s.CalculatedPrice.HasValue && s.CalculatedPrice > 0)
            .Select(s => (double)s.CalculatedPrice!.Value)
            .ToList();

        if (costs.Count < 5)
            return new CostAnomalyResult(false, 0, (double)cost, 0);

        var mean = costs.Average();
        var stdDev = Math.Sqrt(costs.Sum(c => Math.Pow(c - mean, 2)) / costs.Count);

        if (stdDev < 0.01)
            return new CostAnomalyResult(false, 0, mean, stdDev);

        var zScore = ((double)cost - mean) / stdDev;
        var isAnomaly = Math.Abs(zScore) > 2.0; // 2 sigma threshold

        await _predictionLogRepository.CreateAsync(new PredictionLog
        {
            TenantId = tenantId,
            ModelType = "CostAnomaly",
            InputFeatures = JsonSerializer.Serialize(new { cost, mean, stdDev }),
            PredictedValue = zScore,
            PredictionAt = DateTime.UtcNow
        });

        return new CostAnomalyResult(isAnomaly, Math.Round(zScore, 2), Math.Round(mean, 2), Math.Round(stdDev, 2));
    }

    private static double HeuristicPredict(Shipment shipment)
    {
        // Simple distance-based heuristic (major Turkish city pairs)
        var baseDuration = 12.0; // default 12 hours
        if (shipment.OriginCity != null && shipment.DestinationCity != null)
        {
            if (shipment.OriginCity.Equals(shipment.DestinationCity, StringComparison.OrdinalIgnoreCase))
                baseDuration = 3.0;
        }

        if (shipment.ChargeableWeight > 10000) baseDuration *= 1.2;
        if (shipment.IsHazardous) baseDuration *= 1.15;
        if (shipment.RequiresColdChain) baseDuration *= 1.1;

        return baseDuration;
    }
}

public class DeliveryTimePredictionOutput
{
    public float DeliveryHours { get; set; }
}
