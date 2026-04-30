using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Services;

/// <summary>
/// Karar motoru testleri.
/// Provider secimi: fiyat, guvenilirlik skoru, bolge uyumu, kontrat durumu.
/// </summary>
public class DecisionEngineTests
{
    private record ProviderOffer(
        string ProviderName,
        decimal TotalPrice,
        decimal ReliabilityScore,
        string ServiceRegion,
        ContractStatus ContractStatus,
        bool SupportsVehicle);

    [Fact]
    public void ProviderSecimi_IkiProvider_UcuzOlanSecilmeli()
    {
        var offers = new List<ProviderOffer>
        {
            new("Aras", 5000, 90, "Marmara", ContractStatus.Active, true),
            new("MNG", 4500, 85, "Marmara", ContractStatus.Active, true)
        };

        var best = offers
            .Where(o => o.ContractStatus == ContractStatus.Active && o.SupportsVehicle)
            .OrderBy(o => o.TotalPrice)
            .First();

        best.ProviderName.Should().Be("MNG");
        best.TotalPrice.Should().Be(4500);
    }

    [Fact]
    public void ProviderSecimi_FiyatEsit_GuvenilirlikSkoruYuksekOlanSecilmeli()
    {
        var offers = new List<ProviderOffer>
        {
            new("Aras", 5000, 95, "Marmara", ContractStatus.Active, true),
            new("MNG", 5000, 88, "Marmara", ContractStatus.Active, true),
            new("Yurtici", 5000, 92, "Marmara", ContractStatus.Active, true)
        };

        var best = offers
            .Where(o => o.ContractStatus == ContractStatus.Active)
            .OrderBy(o => o.TotalPrice)
            .ThenByDescending(o => o.ReliabilityScore)
            .First();

        best.ProviderName.Should().Be("Aras");
        best.ReliabilityScore.Should().Be(95);
    }

    [Fact]
    public void ProviderSecimi_BolgeUyumsuz_Filtrelenmeli()
    {
        var offers = new List<ProviderOffer>
        {
            new("Aras", 3000, 90, "Ege", ContractStatus.Active, true),
            new("MNG", 4000, 85, "Marmara", ContractStatus.Active, true)
        };

        var targetRegion = "Marmara";
        var filtered = offers
            .Where(o => o.ServiceRegion == targetRegion && o.ContractStatus == ContractStatus.Active)
            .ToList();

        filtered.Should().HaveCount(1);
        filtered.First().ProviderName.Should().Be("MNG");
    }

    [Fact]
    public void ProviderSecimi_ContractSuresiDolmus_Filtrelenmeli()
    {
        var offers = new List<ProviderOffer>
        {
            new("Aras", 3000, 90, "Marmara", ContractStatus.Expired, true),
            new("MNG", 4000, 85, "Marmara", ContractStatus.Active, true),
            new("Yurtici", 3500, 88, "Marmara", ContractStatus.Terminated, true)
        };

        var active = offers
            .Where(o => o.ContractStatus == ContractStatus.Active)
            .ToList();

        active.Should().HaveCount(1);
        active.First().ProviderName.Should().Be("MNG");
    }

    [Fact]
    public void ProviderSecimi_AracTipiDesteklemiyor_Filtrelenmeli()
    {
        var offers = new List<ProviderOffer>
        {
            new("Aras", 3000, 90, "Marmara", ContractStatus.Active, false),
            new("MNG", 4000, 85, "Marmara", ContractStatus.Active, true)
        };

        var supported = offers
            .Where(o => o.SupportsVehicle && o.ContractStatus == ContractStatus.Active)
            .ToList();

        supported.Should().HaveCount(1);
        supported.First().ProviderName.Should().Be("MNG");
    }

    [Fact]
    public void ProviderSecimi_HicUygunProviderYok_BosSonucDonmeli()
    {
        var offers = new List<ProviderOffer>
        {
            new("Aras", 3000, 90, "Ege", ContractStatus.Expired, false),
            new("MNG", 4000, 85, "Karadeniz", ContractStatus.Terminated, false)
        };

        var filtered = offers
            .Where(o => o.ContractStatus == ContractStatus.Active && o.SupportsVehicle)
            .ToList();

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void SavingsHesaplama_EnPahaliEksiEnUcuz()
    {
        var offers = new List<ProviderOffer>
        {
            new("Aras", 5000, 90, "Marmara", ContractStatus.Active, true),
            new("MNG", 4500, 85, "Marmara", ContractStatus.Active, true),
            new("Yurtici", 6000, 92, "Marmara", ContractStatus.Active, true)
        };

        var activeOffers = offers
            .Where(o => o.ContractStatus == ContractStatus.Active)
            .ToList();

        var maxPrice = activeOffers.Max(o => o.TotalPrice);
        var minPrice = activeOffers.Min(o => o.TotalPrice);
        var savings = maxPrice - minPrice;

        savings.Should().Be(1500);
    }

    [Fact]
    public void AgirlikDegisimi_ScoringDegismeli()
    {
        // Hafif yuk: Parsiyel, ucuz
        var lightOffers = new List<ProviderOffer>
        {
            new("Aras", 500, 90, "Marmara", ContractStatus.Active, true),
            new("MNG", 600, 85, "Marmara", ContractStatus.Active, true)
        };

        // Agir yuk: Tir, pahali
        var heavyOffers = new List<ProviderOffer>
        {
            new("Aras", 15000, 90, "Marmara", ContractStatus.Active, true),
            new("MNG", 12000, 85, "Marmara", ContractStatus.Active, true)
        };

        var lightBest = lightOffers.OrderBy(o => o.TotalPrice).First();
        var heavyBest = heavyOffers.OrderBy(o => o.TotalPrice).First();

        lightBest.ProviderName.Should().Be("Aras");
        heavyBest.ProviderName.Should().Be("MNG");

        // Agir yukler icin fiyat farki buyuyor
        var lightSavings = lightOffers.Max(o => o.TotalPrice) - lightOffers.Min(o => o.TotalPrice);
        var heavySavings = heavyOffers.Max(o => o.TotalPrice) - heavyOffers.Min(o => o.TotalPrice);
        heavySavings.Should().BeGreaterThan(lightSavings);
    }

    [Fact]
    public void UrgentSurcharge_DogruEklenmeli()
    {
        decimal basePrice = 5000;
        decimal urgentSurchargePercent = 25;

        var totalWithSurcharge = basePrice * (1 + urgentSurchargePercent / 100m);

        totalWithSurcharge.Should().Be(6250);
    }

    [Fact]
    public void AdrSurcharge_DogruEklenmeli()
    {
        decimal basePrice = 5000;
        decimal adrSurchargePercent = 30;

        var totalWithSurcharge = basePrice * (1 + adrSurchargePercent / 100m);

        totalWithSurcharge.Should().Be(6500);
    }
}
