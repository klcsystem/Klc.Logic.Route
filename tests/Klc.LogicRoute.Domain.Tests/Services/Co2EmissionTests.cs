using FluentAssertions;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Services;

/// <summary>
/// CO2 emisyon hesaplama testleri.
/// Formul: CO2 (kg) = Mesafe (km) x Yuk (ton) x Emisyon Faktoru
/// Emisyon faktorleri arac tipine gore degisir.
/// </summary>
public class Co2EmissionTests
{
    // Emisyon faktorleri (kg CO2 / ton-km)
    private static decimal GetEmissionFactor(VehicleCategory vehicle) => vehicle switch
    {
        VehicleCategory.Tir => 0.062m,
        VehicleCategory.Kamyon => 0.074m,
        VehicleCategory.Kamyonet => 0.089m,
        VehicleCategory.Parsiyel => 0.105m,
        VehicleCategory.Frigorifik => 0.093m,   // sogutma ekstra enerji
        VehicleCategory.Tanker => 0.085m,
        VehicleCategory.LowBed => 0.070m,
        VehicleCategory.Konteyner => 0.058m,
        _ => 0.080m
    };

    [Theory]
    [InlineData(VehicleCategory.Tir, 500, 20000, 620)]        // 500km x 20ton x 0.062
    [InlineData(VehicleCategory.Kamyon, 300, 8000, 177.6)]     // 300km x 8ton x 0.074
    [InlineData(VehicleCategory.Kamyonet, 100, 1500, 13.35)]   // 100km x 1.5ton x 0.089
    [InlineData(VehicleCategory.Parsiyel, 50, 200, 1.05)]      // 50km x 0.2ton x 0.105
    public void Co2Hesaplama_AracTipineGore_DogruOlmali(
        VehicleCategory vehicle, decimal distanceKm, decimal weightKg, decimal expectedCo2Kg)
    {
        var weightTon = weightKg / 1000m;
        var factor = GetEmissionFactor(vehicle);
        var co2 = Math.Round(distanceKm * weightTon * factor, 2);

        co2.Should().BeApproximately(expectedCo2Kg, 0.01m);
    }

    [Fact]
    public void Co2Hesaplama_SifirMesafe_SifirEmisyon()
    {
        var co2 = 0m * 20m * GetEmissionFactor(VehicleCategory.Tir);
        co2.Should().Be(0);
    }

    [Fact]
    public void Co2Hesaplama_SifirAgirlik_SifirEmisyon()
    {
        var co2 = 500m * 0m * GetEmissionFactor(VehicleCategory.Tir);
        co2.Should().Be(0);
    }

    [Fact]
    public void Co2Hesaplama_FrigorifkDahaYuksekEmisyon()
    {
        var distanceKm = 500m;
        var weightTon = 10m;

        var co2Kamyon = distanceKm * weightTon * GetEmissionFactor(VehicleCategory.Kamyon);
        var co2Frigo = distanceKm * weightTon * GetEmissionFactor(VehicleCategory.Frigorifik);

        co2Frigo.Should().BeGreaterThan(co2Kamyon, "Frigorifik sogutma icin ekstra enerji harcar");
    }

    [Fact]
    public void Co2Hesaplama_TirEnVerimli()
    {
        var distanceKm = 500m;
        var weightTon = 10m;

        var co2Tir = distanceKm * weightTon * GetEmissionFactor(VehicleCategory.Tir);
        var co2Kamyon = distanceKm * weightTon * GetEmissionFactor(VehicleCategory.Kamyon);
        var co2Parsiyel = distanceKm * weightTon * GetEmissionFactor(VehicleCategory.Parsiyel);

        co2Tir.Should().BeLessThan(co2Kamyon);
        co2Kamyon.Should().BeLessThan(co2Parsiyel);
    }

    [Fact]
    public void Co2Tasarruf_AlternatifKarsilastirmasi()
    {
        var distanceKm = 500m;
        var weightTon = 15m;

        var co2Tir = distanceKm * weightTon * GetEmissionFactor(VehicleCategory.Tir);
        var co2Kamyon = distanceKm * weightTon * GetEmissionFactor(VehicleCategory.Kamyon);

        var savings = co2Kamyon - co2Tir;
        var savingsPercent = savings / co2Kamyon * 100;

        savings.Should().BeGreaterThan(0);
        savingsPercent.Should().BeGreaterThan(10, "Tir, Kamyona gore en az %10 daha verimli olmali");
    }
}
