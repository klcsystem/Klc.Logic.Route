using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class RecommendationTests
{
    [Fact]
    public void Recommendation_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var rec = new Recommendation();

        rec.Id.Should().NotBeEmpty();
        rec.CalculatedPrice.Should().Be(0);
        rec.SavingsAmount.Should().Be(0);
        rec.SavingsPercent.Should().Be(0);
        rec.ScorePrice.Should().Be(0);
        rec.ScoreSpeed.Should().Be(0);
        rec.ScoreReliability.Should().Be(0);
        rec.OverallScore.Should().Be(0);
        rec.Currency.Should().Be("TRY");
        rec.CalculatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Recommendation_ProviderVeContractRateAtanabilmeli()
    {
        var providerId = Guid.NewGuid();
        var rateId = Guid.NewGuid();
        var shipmentId = Guid.NewGuid();

        var rec = new Recommendation
        {
            ShipmentId = shipmentId,
            SelectedProviderId = providerId,
            SelectedContractRateId = rateId,
            SelectedProviderName = "Aras Kargo",
            CalculatedPrice = 5000
        };

        rec.ShipmentId.Should().Be(shipmentId);
        rec.SelectedProviderId.Should().Be(providerId);
        rec.SelectedProviderName.Should().Be("Aras Kargo");
        rec.CalculatedPrice.Should().Be(5000);
    }

    [Fact]
    public void Recommendation_AlternatiflerAtanabilmeli()
    {
        var rec = new Recommendation
        {
            CalculatedPrice = 4500,
            AlternativePrice1 = 5000,
            AlternativeProviderName1 = "MNG",
            AlternativePrice2 = 6000,
            AlternativeProviderName2 = "Yurtici"
        };

        rec.AlternativePrice1.Should().Be(5000);
        rec.AlternativeProviderName1.Should().Be("MNG");
    }

    [Fact]
    public void Recommendation_TasarrufHesaplamaDogruOlmali()
    {
        var rec = new Recommendation
        {
            CalculatedPrice = 4500,
            SavingsAmount = 1500,
            SavingsPercent = 25
        };

        rec.SavingsAmount.Should().Be(1500);
        rec.SavingsPercent.Should().Be(25);
    }

    [Fact]
    public void Recommendation_ScoringAtanabilmeli()
    {
        var rec = new Recommendation
        {
            ScorePrice = 40,
            ScoreSpeed = 25,
            ScoreReliability = 28,
            OverallScore = 93,
            Reason = RecommendationReason.WeightedScore,
            Explanation = "Fiyat: 40/40, Hiz: 25/30, Guvenilirlik: 28/30"
        };

        rec.OverallScore.Should().Be(93);
        rec.Reason.Should().Be(RecommendationReason.WeightedScore);
    }

    [Theory]
    [InlineData(RecommendationReason.CheapestPrice)]
    [InlineData(RecommendationReason.FastestDelivery)]
    [InlineData(RecommendationReason.BestPerformance)]
    [InlineData(RecommendationReason.RuleBased)]
    [InlineData(RecommendationReason.WeightedScore)]
    public void Recommendation_TumReasonDegerleriAtanabilmeli(RecommendationReason reason)
    {
        var rec = new Recommendation { Reason = reason };
        rec.Reason.Should().Be(reason);
    }
}
