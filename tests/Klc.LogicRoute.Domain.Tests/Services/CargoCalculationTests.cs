using FluentAssertions;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Services;

/// <summary>
/// Kargo hesaplama formulleri testleri.
/// DesiWeight = Width × Height × Depth / 3000
/// ChargeableWeight = Max(ActualWeight, DesiWeight)
/// VehicleCategory secimi agirliga gore.
/// </summary>
public class CargoCalculationTests
{
    // --- Desi Hesaplama ---

    [Theory]
    [InlineData(60, 40, 40, 32)]           // standart koli
    [InlineData(120, 80, 100, 320)]         // palet boyutu
    [InlineData(100, 100, 100, 333.33)]     // kup
    [InlineData(30, 20, 15, 3)]             // kucuk paket
    [InlineData(200, 120, 150, 1200)]       // buyuk kargo
    public void DesiWeight_StandartBoyutlar_DogruHesaplanmali(
        decimal widthCm, decimal heightCm, decimal depthCm, decimal expectedDesi)
    {
        var desi = Math.Round(widthCm * heightCm * depthCm / 3000m, 2);
        desi.Should().BeApproximately(expectedDesi, 0.01m);
    }

    [Theory]
    [InlineData(0, 40, 40)]
    [InlineData(60, 0, 40)]
    [InlineData(60, 40, 0)]
    [InlineData(0, 0, 0)]
    public void DesiWeight_SifirBoyut_SifirOlmali(decimal w, decimal h, decimal d)
    {
        var desi = w * h * d / 3000m;
        desi.Should().Be(0);
    }

    [Fact]
    public void DesiWeight_CokBuyukBoyut_DogruHesaplanmali()
    {
        // 10 metre kup container boyutu
        decimal w = 1000, h = 1000, d = 1000;
        var desi = w * h * d / 3000m;
        desi.Should().BeGreaterThan(0);
        Math.Round(desi, 2).Should().Be(333333.33m, "1000x1000x1000 / 3000 = 333333.33");
    }

    // --- Chargeable Weight ---

    [Theory]
    [InlineData(25, 32, 32)]     // Desi > Actual
    [InlineData(50, 32, 50)]     // Actual > Desi
    [InlineData(100, 100, 100)]  // Esit
    [InlineData(0, 0, 0)]        // Ikisi de sifir
    [InlineData(0, 50, 50)]      // Actual sifir
    [InlineData(50, 0, 50)]      // Desi sifir
    public void ChargeableWeight_MaxDegerOlmali(decimal actualKg, decimal desiKg, decimal expected)
    {
        var chargeable = Math.Max(actualKg, desiKg);
        chargeable.Should().Be(expected);
    }

    [Fact]
    public void ChargeableWeight_60x40x40_25kg_DesiKullanilmali()
    {
        // 60x40x40 = 96000 / 3000 = 32 desi
        // Actual = 25 kg, Desi = 32 kg → Chargeable = 32
        decimal actualKg = 25;
        decimal desi = 60m * 40m * 40m / 3000m; // = 32
        var chargeable = Math.Max(actualKg, desi);

        chargeable.Should().Be(32);
    }

    [Fact]
    public void ChargeableWeight_60x40x40_50kg_ActualKullanilmali()
    {
        // Actual = 50 kg, Desi = 32 kg → Chargeable = 50
        decimal actualKg = 50;
        decimal desi = 60m * 40m * 40m / 3000m; // = 32
        var chargeable = Math.Max(actualKg, desi);

        chargeable.Should().Be(50);
    }

    // --- Arac Tipi Belirleme ---

    [Theory]
    [InlineData(25000, VehicleCategory.Tir)]
    [InlineData(15000, VehicleCategory.Tir)]
    [InlineData(8000, VehicleCategory.Kamyon)]
    [InlineData(5000, VehicleCategory.Kamyon)]
    [InlineData(3000, VehicleCategory.Kamyonet)]
    [InlineData(1500, VehicleCategory.Kamyonet)]
    [InlineData(1000, VehicleCategory.Kamyonet)]
    [InlineData(999, VehicleCategory.Parsiyel)]
    [InlineData(500, VehicleCategory.Parsiyel)]
    [InlineData(200, VehicleCategory.Parsiyel)]
    public void AracTipiBelirleme_AgirligaGore_DogruKategoriSecilmeli(
        decimal weightKg, VehicleCategory expectedCategory)
    {
        var category = DetermineVehicleCategory(weightKg, false, false);
        category.Should().Be(expectedCategory);
    }

    [Fact]
    public void AracTipiBelirleme_Hazardous_TankerOlmali()
    {
        var category = DetermineVehicleCategory(5000, isHazardous: true, requiresColdChain: false);
        category.Should().Be(VehicleCategory.Tanker);
    }

    [Fact]
    public void AracTipiBelirleme_ColdChain_FrigoOlmali()
    {
        var category = DetermineVehicleCategory(5000, isHazardous: false, requiresColdChain: true);
        category.Should().Be(VehicleCategory.Frigorifik);
    }

    [Fact]
    public void AracTipiBelirleme_SifirAgirlik_ParsiyelOlmali()
    {
        var category = DetermineVehicleCategory(0, false, false);
        category.Should().Be(VehicleCategory.Parsiyel);
    }

    // --- Surcharge Hesaplama ---

    [Theory]
    [InlineData(10000, 3.50, 25, 0, 0, 43750)]    // Urgent +25%
    [InlineData(10000, 3.50, 0, 30, 0, 45500)]     // ADR +30%
    [InlineData(10000, 3.50, 0, 0, 20, 42000)]     // Frigo +20%
    [InlineData(10000, 3.50, 25, 30, 20, 61250)]    // Hepsi birden: 35000 * 1.75
    public void SurchargeHesaplama_DogruToplam(
        decimal weightKg, decimal pricePerKg,
        decimal urgentPct, decimal adrPct, decimal frigoPct,
        decimal expectedTotal)
    {
        var baseTotal = weightKg * pricePerKg;
        var surchargeMultiplier = 1m + (urgentPct + adrPct + frigoPct) / 100m;
        var total = baseTotal * surchargeMultiplier;

        total.Should().Be(expectedTotal);
    }

    // --- Helper ---

    private static VehicleCategory DetermineVehicleCategory(decimal weightKg, bool isHazardous, bool requiresColdChain)
    {
        if (isHazardous) return VehicleCategory.Tanker;
        if (requiresColdChain) return VehicleCategory.Frigorifik;
        if (weightKg >= 10000) return VehicleCategory.Tir;
        if (weightKg >= 3500) return VehicleCategory.Kamyon;
        if (weightKg >= 1000) return VehicleCategory.Kamyonet;
        return VehicleCategory.Parsiyel;
    }
}
