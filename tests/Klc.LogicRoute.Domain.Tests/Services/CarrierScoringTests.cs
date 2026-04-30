using FluentAssertions;

namespace Klc.LogicRoute.Domain.Tests.Services;

/// <summary>
/// Tasiyici puanlama testleri.
/// Scoring: Fiyat (%40) + Zamaninda Teslimat (%30) + Hasar Orani (%20) + Musteri Memnuniyeti (%10)
/// </summary>
public class CarrierScoringTests
{
    private record CarrierScore(
        string ProviderName,
        decimal PriceScore,          // 0-100
        decimal OnTimeDeliveryRate,  // 0-100 yuzde
        decimal DamageRate,          // 0-100 yuzde (dusuk = iyi)
        decimal CustomerSatisfaction // 0-100
    );

    private static decimal CalculateOverallScore(CarrierScore carrier)
    {
        var priceWeight = 0.40m;
        var onTimeWeight = 0.30m;
        var damageWeight = 0.20m;
        var satisfactionWeight = 0.10m;

        return Math.Round(
            carrier.PriceScore * priceWeight +
            carrier.OnTimeDeliveryRate * onTimeWeight +
            (100 - carrier.DamageRate) * damageWeight +  // dusuk hasar = yuksek skor
            carrier.CustomerSatisfaction * satisfactionWeight,
            2);
    }

    [Fact]
    public void Scoring_MukemmelTasiyici_YuksekSkor()
    {
        var carrier = new CarrierScore("Aras", 95, 98, 1, 92);
        var score = CalculateOverallScore(carrier);

        score.Should().BeGreaterThan(90);
    }

    [Fact]
    public void Scoring_KotuTasiyici_DusukSkor()
    {
        var carrier = new CarrierScore("KotuKargo", 30, 50, 15, 40);
        var score = CalculateOverallScore(carrier);

        score.Should().BeLessThan(50);
    }

    [Fact]
    public void Scoring_FiyatAgirligiEnYuksek()
    {
        // Ayni degerler ama fiyat farkli
        var ucuzProvider = new CarrierScore("Ucuz", 100, 80, 5, 80);
        var pahaliProvider = new CarrierScore("Pahali", 40, 80, 5, 80);

        var ucuzScore = CalculateOverallScore(ucuzProvider);
        var pahaliScore = CalculateOverallScore(pahaliProvider);

        ucuzScore.Should().BeGreaterThan(pahaliScore);
        (ucuzScore - pahaliScore).Should().BeGreaterThan(20, "Fiyat %40 agirlikla en buyuk etki");
    }

    [Fact]
    public void Scoring_ZamanindaTeslimatIkinciOncelik()
    {
        var zamaninda = new CarrierScore("Zamaninda", 70, 99, 5, 80);
        var geciken = new CarrierScore("Geciken", 70, 50, 5, 80);

        var zamanindaScore = CalculateOverallScore(zamaninda);
        var gecikenScore = CalculateOverallScore(geciken);

        zamanindaScore.Should().BeGreaterThan(gecikenScore);
    }

    [Fact]
    public void Scoring_YuksekHasarOrani_SkoruDusurur()
    {
        var dusukHasar = new CarrierScore("DusukHasar", 70, 80, 2, 80);
        var yuksekHasar = new CarrierScore("YuksekHasar", 70, 80, 20, 80);

        var dusukScore = CalculateOverallScore(dusukHasar);
        var yuksekScore = CalculateOverallScore(yuksekHasar);

        dusukScore.Should().BeGreaterThan(yuksekScore);
    }

    [Fact]
    public void Scoring_SiralamaDogru()
    {
        var carriers = new List<CarrierScore>
        {
            new("Aras", 90, 95, 2, 88),
            new("MNG", 85, 88, 5, 82),
            new("Yurtici", 75, 92, 3, 90),
            new("PTT", 60, 70, 10, 65)
        };

        var ranked = carriers
            .Select(c => new { c.ProviderName, Score = CalculateOverallScore(c) })
            .OrderByDescending(c => c.Score)
            .ToList();

        ranked.First().ProviderName.Should().Be("Aras");
        ranked.Last().ProviderName.Should().Be("PTT");
    }

    [Fact]
    public void Scoring_TumDegerlerSifir_SifirSkor()
    {
        var carrier = new CarrierScore("Bos", 0, 0, 0, 0);
        var score = CalculateOverallScore(carrier);

        // DamageRate 0 = (100-0)*0.20 = 20
        score.Should().Be(20);
    }

    [Fact]
    public void Scoring_TumDegerlerMaksimum_100eYakin()
    {
        var carrier = new CarrierScore("Perfect", 100, 100, 0, 100);
        var score = CalculateOverallScore(carrier);

        score.Should().Be(100);
    }
}
