using Klc.LogicRoute.Application.ML.Services;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.DecisionEngine;

public class DecisionEngineService(
    IContractRepository contractRepository,
    IProviderRepository providerRepository,
    ICarrierPerformanceRepository carrierPerformanceRepository,
    IMLPredictionService mlPredictionService) : IDecisionEngineService
{
    public async Task<Recommendation> CalculateBestOptionAsync(Shipment shipment, DecisionCriteria criteria, Guid tenantId)
    {
        var providers = await providerRepository.GetAllAsync(tenantId);
        var candidates = new List<CandidateResult>();

        foreach (var provider in providers.Where(p => p.IsActive))
        {
            var contracts = await contractRepository.GetAllAsync(tenantId);
            var activeContracts = contracts
                .Where(c => c.ProviderId == provider.Id
                    && c.Status == ContractStatus.Active
                    && c.StartDate <= DateTime.UtcNow
                    && c.EndDate >= DateTime.UtcNow)
                .ToList();

            // Get provider performance (if available)
            var performance = await carrierPerformanceRepository.GetByProviderAsync(
                provider.Id, tenantId, DateTime.UtcNow.Year, DateTime.UtcNow.Month);
            var reliabilityScore = performance?.OnTimePercentage / 100m ?? 0.5m;

            foreach (var contract in activeContracts)
            {
                var rates = await contractRepository.GetRatesAsync(contract.Id);
                var matchingRates = rates.Where(r =>
                    r.IsActive
                    && MatchesRegion(r.OriginRegion, shipment.OriginCity)
                    && MatchesRegion(r.DestinationRegion, shipment.DestinationCity)
                    && MatchesWeight(r.MinWeightKg, r.MaxWeightKg, shipment.ChargeableWeight)
                    && MatchesVehicle(r.VehicleCategory, shipment.RecommendedVehicle))
                    .ToList();

                foreach (var rate in matchingRates)
                {
                    var basePrice = CalculateBasePrice(rate, shipment);
                    var surcharge = CalculateSurcharge(rate, shipment, basePrice);
                    var totalPrice = basePrice + surcharge;

                    candidates.Add(new CandidateResult
                    {
                        ProviderId = provider.Id,
                        ProviderName = provider.Name,
                        ContractRateId = rate.Id,
                        TotalPrice = totalPrice,
                        ReliabilityScore = reliabilityScore,
                        VehicleCategory = rate.VehicleCategory
                    });
                }
            }
        }

        if (candidates.Count == 0)
        {
            return new Recommendation
            {
                TenantId = tenantId,
                ShipmentId = shipment.Id,
                Explanation = "Eslesen tarife bulunamadi",
                CalculatedAt = DateTime.UtcNow
            };
        }

        // Normalize scores
        var maxPrice = candidates.Max(c => c.TotalPrice);
        var minPrice = candidates.Min(c => c.TotalPrice);
        var priceRange = maxPrice - minPrice;

        foreach (var c in candidates)
        {
            c.ScorePrice = priceRange > 0 ? (1m - (c.TotalPrice - minPrice) / priceRange) : 1m;
            // ML-powered speed score: use delivery time prediction to derive speed score
            try
            {
                var prediction = mlPredictionService.PredictDeliveryTimeAsync(shipment, tenantId).GetAwaiter().GetResult();
                // Normalize: faster delivery = higher score (24h baseline)
                c.ScoreSpeed = Math.Max(0m, Math.Min(1m, 1m - (decimal)prediction.PredictedHours / 24m));
            }
            catch
            {
                c.ScoreSpeed = 0.7m; // fallback if ML unavailable
            }
            c.ScoreReliability = c.ReliabilityScore;
            c.OverallScore = c.ScorePrice * criteria.PriceWeight
                           + c.ScoreSpeed * criteria.SpeedWeight
                           + c.ScoreReliability * criteria.ReliabilityWeight;
        }

        var ranked = candidates.OrderByDescending(c => c.OverallScore).ToList();
        var best = ranked[0];
        var alt1 = ranked.Count > 1 ? ranked[1] : null;
        var alt2 = ranked.Count > 2 ? ranked[2] : null;

        var savingsAmount = maxPrice - best.TotalPrice;
        var savingsPercent = maxPrice > 0 ? savingsAmount / maxPrice * 100m : 0m;

        var reason = DetermineReason(best, criteria);

        return new Recommendation
        {
            TenantId = tenantId,
            ShipmentId = shipment.Id,
            SelectedProviderId = best.ProviderId,
            SelectedContractRateId = best.ContractRateId,
            SelectedProviderName = best.ProviderName,
            CalculatedPrice = best.TotalPrice,
            AlternativePrice1 = alt1?.TotalPrice,
            AlternativeProviderId1 = alt1?.ProviderId,
            AlternativeProviderName1 = alt1?.ProviderName,
            AlternativePrice2 = alt2?.TotalPrice,
            AlternativeProviderId2 = alt2?.ProviderId,
            AlternativeProviderName2 = alt2?.ProviderName,
            SavingsAmount = Math.Round(savingsAmount, 2),
            SavingsPercent = Math.Round(savingsPercent, 2),
            Reason = reason,
            ScorePrice = Math.Round(best.ScorePrice * 100, 2),
            ScoreSpeed = Math.Round(best.ScoreSpeed * 100, 2),
            ScoreReliability = Math.Round(best.ScoreReliability * 100, 2),
            OverallScore = Math.Round(best.OverallScore * 100, 2),
            RecommendedVehicle = best.VehicleCategory,
            Currency = "TRY",
            Explanation = BuildExplanation(best, alt1, savingsAmount, savingsPercent, reason),
            CalculatedAt = DateTime.UtcNow
        };
    }

    private static bool MatchesRegion(string? rateRegion, string? city)
    {
        if (string.IsNullOrEmpty(rateRegion) || rateRegion == "*") return true;
        if (string.IsNullOrEmpty(city)) return true;
        return rateRegion.Equals(city, StringComparison.OrdinalIgnoreCase);
    }

    private static bool MatchesWeight(decimal min, decimal max, decimal weight)
        => weight >= min && weight <= max;

    private static bool MatchesVehicle(VehicleCategory rateVehicle, VehicleCategory suggested)
        => rateVehicle == suggested;

    private static decimal CalculateBasePrice(ContractRate rate, Shipment shipment)
    {
        return rate.PricingUnit switch
        {
            PricingUnit.PerKg => rate.PricePerUnit * shipment.ChargeableWeight,
            PricingUnit.PerM3 => rate.PricePerUnit * shipment.TotalVolumeM3,
            PricingUnit.PerPallet => rate.PricePerUnit * shipment.PalletCount,
            PricingUnit.PerTrip or PricingUnit.FlatRate => rate.PricePerUnit,
            _ => rate.PricePerUnit * shipment.ChargeableWeight
        };
    }

    private static decimal CalculateSurcharge(ContractRate rate, Shipment shipment, decimal basePrice)
    {
        var surcharge = 0m;
        if (shipment.Priority == ShipmentPriority.Urgent && rate.UrgentSurchargePercent.HasValue)
            surcharge += basePrice * rate.UrgentSurchargePercent.Value / 100m;
        if (shipment.IsHazardous && rate.AdrSurchargePercent.HasValue)
            surcharge += basePrice * rate.AdrSurchargePercent.Value / 100m;
        if (shipment.RequiresColdChain && rate.FrigoSurchargePercent.HasValue)
            surcharge += basePrice * rate.FrigoSurchargePercent.Value / 100m;
        if (shipment.RequestedDeliveryDate.HasValue
            && (shipment.RequestedDeliveryDate.Value.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            && rate.WeekendSurchargePercent.HasValue)
            surcharge += basePrice * rate.WeekendSurchargePercent.Value / 100m;
        return surcharge;
    }

    private static RecommendationReason DetermineReason(CandidateResult best, DecisionCriteria criteria)
    {
        if (criteria.PriceWeight >= 0.8m) return RecommendationReason.CheapestPrice;
        if (criteria.SpeedWeight >= 0.5m) return RecommendationReason.FastestDelivery;
        if (criteria.ReliabilityWeight >= 0.5m) return RecommendationReason.BestPerformance;
        return RecommendationReason.WeightedScore;
    }

    private static string BuildExplanation(CandidateResult best, CandidateResult? alt, decimal savings, decimal savingsPercent, RecommendationReason reason)
    {
        var parts = new List<string> { $"{best.ProviderName}: {best.TotalPrice:F2} TRY" };
        if (alt != null && savings > 0)
            parts.Add($"{alt.ProviderName}'e gore %{savingsPercent:F1} daha uygun ({savings:F2} TRY tasarruf)");
        parts.Add($"Karar: {reason}");
        return string.Join(". ", parts);
    }

    private class CandidateResult
    {
        public Guid ProviderId { get; set; }
        public string ProviderName { get; set; } = "";
        public Guid ContractRateId { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal ReliabilityScore { get; set; }
        public VehicleCategory VehicleCategory { get; set; }
        public decimal ScorePrice { get; set; }
        public decimal ScoreSpeed { get; set; }
        public decimal ScoreReliability { get; set; }
        public decimal OverallScore { get; set; }
    }
}
