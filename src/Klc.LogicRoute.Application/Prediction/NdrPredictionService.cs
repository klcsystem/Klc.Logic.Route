using Klc.LogicRoute.Application.Prediction.Models;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Application.Prediction;

public class NdrPredictionService : INdrPredictionService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IShipmentRepository _shipmentRepository;
    private readonly ILogger<NdrPredictionService> _logger;

    public NdrPredictionService(
        IOrderRepository orderRepository,
        IShipmentRepository shipmentRepository,
        ILogger<NdrPredictionService> logger)
    {
        _orderRepository = orderRepository;
        _shipmentRepository = shipmentRepository;
        _logger = logger;
    }

    public async Task<NdrRiskScore> PredictAsync(Guid orderId, Guid tenantId)
    {
        var order = await _orderRepository.GetByIdAsync(orderId, tenantId);
        if (order is null)
            throw new InvalidOperationException($"Order {orderId} not found.");

        var factors = new List<string>();
        var recommendations = new List<string>();
        var totalScore = 0.0;
        var weightSum = 0.0;

        // Factor 1: Customer's past NDR rate (weight: 35)
        var pastNdrScore = await CalculateCustomerNdrRateAsync(order.CustomerName, tenantId);
        totalScore += pastNdrScore * 35;
        weightSum += 35;
        if (pastNdrScore > 0.5)
        {
            factors.Add($"Müşteri geçmiş NDR oranı yüksek ({pastNdrScore:P0})");
            recommendations.Add("Teslimat öncesi müşteri ile telefon teyidi alınmalı");
        }

        // Factor 2: Time-of-day pattern (weight: 20)
        var timeScore = CalculateTimeOfDayRisk(order.RequestedDeliveryDate);
        totalScore += timeScore * 20;
        weightSum += 20;
        if (timeScore > 0.5)
        {
            factors.Add("Akşam saatlerinde teslimat başarısızlık oranı yüksek");
            recommendations.Add("Teslimat saatini gün içine (09:00-17:00) kaydırın");
        }

        // Factor 3: Day-of-week risk (weight: 15)
        var dayScore = CalculateDayOfWeekRisk(order.RequestedDeliveryDate, order.ProductCategory);
        totalScore += dayScore * 15;
        weightSum += 15;
        if (dayScore > 0.5)
        {
            factors.Add("Hafta sonu B2B teslimatlarında başarısızlık riski yüksek");
            recommendations.Add("Hafta içi teslimat planlayın");
        }

        // Factor 4: Address quality (weight: 20)
        var addressScore = CalculateAddressQualityRisk(
            order.DestinationAddress, order.DestinationLat, order.DestinationLng);
        totalScore += addressScore * 20;
        weightSum += 20;
        if (addressScore > 0.5)
        {
            factors.Add("Adres bilgisi eksik veya koordinat bilgisi yok");
            recommendations.Add("Adres bilgisini tamamlayın ve geocoding yapın");
        }

        // Factor 5: Weather risk placeholder (weight: 10)
        var weatherScore = CalculateWeatherRiskPlaceholder();
        totalScore += weatherScore * 10;
        weightSum += 10;
        if (weatherScore > 0.3)
        {
            factors.Add("Hava durumu riski (placeholder — entegrasyon bekleniyor)");
        }

        // Calculate final score (0-100)
        var finalScore = (int)Math.Round(weightSum > 0 ? (totalScore / weightSum) * 100 : 0);
        finalScore = Math.Clamp(finalScore, 0, 100);

        if (factors.Count == 0)
            factors.Add("Düşük risk — belirgin risk faktörü tespit edilmedi");

        if (recommendations.Count == 0)
            recommendations.Add("Standart teslimat süreci uygulanabilir");

        var riskLevel = finalScore switch
        {
            >= 75 => NdrRiskLevel.Critical,
            >= 50 => NdrRiskLevel.High,
            >= 25 => NdrRiskLevel.Medium,
            _ => NdrRiskLevel.Low
        };

        _logger.LogInformation(
            "NDR prediction for order {OrderId}: score={Score}, level={Level}, factors={FactorCount}",
            orderId, finalScore, riskLevel, factors.Count);

        return new NdrRiskScore
        {
            OrderId = orderId,
            Score = finalScore,
            RiskLevel = riskLevel,
            Factors = factors,
            Recommendations = recommendations
        };
    }

    public async Task<NdrBatchResult> PredictBatchAsync(List<Guid> orderIds, Guid tenantId)
    {
        var results = new List<NdrRiskScore>();
        foreach (var orderId in orderIds)
        {
            try
            {
                var score = await PredictAsync(orderId, tenantId);
                results.Add(score);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "NDR prediction failed for order {OrderId}", orderId);
            }
        }

        return new NdrBatchResult
        {
            Results = results,
            TotalOrders = results.Count,
            HighRiskCount = results.Count(r => r.RiskLevel == NdrRiskLevel.High),
            CriticalRiskCount = results.Count(r => r.RiskLevel == NdrRiskLevel.Critical),
            AverageScore = results.Count > 0 ? results.Average(r => r.Score) : 0
        };
    }

    private async Task<double> CalculateCustomerNdrRateAsync(string? customerName, Guid tenantId)
    {
        if (string.IsNullOrWhiteSpace(customerName))
            return 0.3; // Unknown customer — moderate risk

        // Query past shipments for this customer
        var allShipments = await _shipmentRepository.GetAllAsync(tenantId, page: 1, pageSize: 200);
        var customerShipments = allShipments
            .Where(s => string.Equals(s.DriverName, customerName, StringComparison.OrdinalIgnoreCase)
                     || string.Equals(s.DestinationAddress, customerName, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (customerShipments.Count < 3)
            return 0.2; // Not enough history — slightly elevated default

        var failedCount = customerShipments.Count(s =>
            s.Status == ShipmentStatus.Cancelled);

        return (double)failedCount / customerShipments.Count;
    }

    private static double CalculateTimeOfDayRisk(DateTime? requestedDelivery)
    {
        if (!requestedDelivery.HasValue)
            return 0.2; // Unknown time — slight risk

        var hour = requestedDelivery.Value.Hour;

        return hour switch
        {
            >= 9 and <= 17 => 0.1,   // Business hours — low risk
            >= 18 and <= 20 => 0.5,  // Evening — moderate risk
            >= 21 or <= 6 => 0.8,    // Night — high risk
            _ => 0.3                  // Early morning/late afternoon
        };
    }

    private static double CalculateDayOfWeekRisk(DateTime? requestedDelivery, string? productCategory)
    {
        if (!requestedDelivery.HasValue)
            return 0.15;

        var dayOfWeek = requestedDelivery.Value.DayOfWeek;
        var isB2B = !string.IsNullOrWhiteSpace(productCategory) &&
                    (productCategory.Contains("B2B", StringComparison.OrdinalIgnoreCase) ||
                     productCategory.Contains("Corporate", StringComparison.OrdinalIgnoreCase) ||
                     productCategory.Contains("Industrial", StringComparison.OrdinalIgnoreCase));

        if (isB2B && (dayOfWeek == DayOfWeek.Saturday || dayOfWeek == DayOfWeek.Sunday))
            return 0.8; // B2B on weekends — very risky

        if (dayOfWeek == DayOfWeek.Sunday)
            return 0.4; // Sunday generally riskier

        return 0.1; // Weekdays — low risk
    }

    private static double CalculateAddressQualityRisk(string? address, double? lat, double? lng)
    {
        var score = 0.0;

        if (string.IsNullOrWhiteSpace(address))
            score += 0.5;
        else if (address.Length < 20)
            score += 0.3; // Short address — possibly incomplete

        if (!lat.HasValue || !lng.HasValue)
            score += 0.4; // No coordinates — can't verify address
        else if (lat.Value == 0 && lng.Value == 0)
            score += 0.4; // Invalid coordinates

        return Math.Min(score, 1.0);
    }

    private static double CalculateWeatherRiskPlaceholder()
    {
        // Placeholder: returns low baseline risk until weather API integration
        return 0.1;
    }
}
