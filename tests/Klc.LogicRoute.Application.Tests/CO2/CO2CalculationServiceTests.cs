using FluentAssertions;
using Klc.LogicRoute.Application.CO2;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Application.Tests.CO2;

public class CO2CalculationServiceTests
{
    private readonly CO2CalculationService _sut = new();

    [Theory]
    [InlineData(VehicleCategory.Tir, 500, 20000, 0.062)]
    [InlineData(VehicleCategory.Kamyon, 300, 8000, 0.150)]
    [InlineData(VehicleCategory.Kamyonet, 100, 1500, 0.350)]
    [InlineData(VehicleCategory.Parsiyel, 200, 500, 0.200)]
    [InlineData(VehicleCategory.Frigorifik, 400, 10000, 0.180)]
    [InlineData(VehicleCategory.Tanker, 600, 25000, 0.080)]
    [InlineData(VehicleCategory.LowBed, 150, 30000, 0.100)]
    [InlineData(VehicleCategory.Konteyner, 800, 20000, 0.070)]
    public void Calculate_AllVehicleTypes_ReturnsCorrectCO2(
        VehicleCategory vehicle, decimal distanceKm, decimal weightKg, decimal expectedFactor)
    {
        var result = _sut.Calculate(distanceKm, weightKg, vehicle);

        var expectedCo2 = Math.Round(distanceKm * (weightKg / 1000m) * expectedFactor, 2);
        result.CO2Kg.Should().Be(expectedCo2);
    }

    [Fact]
    public void Calculate_ZeroDistance_ReturnsZeroCO2()
    {
        var result = _sut.Calculate(0, 10000, VehicleCategory.Tir);

        result.CO2Kg.Should().Be(0);
        result.CO2PerKgKm.Should().Be(0);
    }

    [Fact]
    public void Calculate_ZeroWeight_ReturnsZeroCO2()
    {
        var result = _sut.Calculate(500, 0, VehicleCategory.Kamyon);

        result.CO2Kg.Should().Be(0);
        result.CO2PerKgKm.Should().Be(0);
    }

    [Fact]
    public void Calculate_ReturnsGLECMethodName()
    {
        var result = _sut.Calculate(100, 1000, VehicleCategory.Tir);

        result.CalculationMethod.Should().Be("GLEC Framework v3.0");
    }

    [Fact]
    public void Calculate_ReturnsVehicleTypeName()
    {
        var result = _sut.Calculate(100, 1000, VehicleCategory.Frigorifik);

        result.VehicleType.Should().Be("Frigorifik");
    }

    [Fact]
    public void Calculate_CO2PerKgKm_CalculatedCorrectly()
    {
        var result = _sut.Calculate(500, 20000, VehicleCategory.Tir);

        // CO2Kg = 500 * 20 * 0.062 = 620
        // CO2PerKgKm = 620 / (500 * 20000) = 0.000062
        result.CO2Kg.Should().Be(620m);
        result.CO2PerKgKm.Should().Be(0.000062m);
    }

    [Fact]
    public void Calculate_TirMostEfficient_PerTonneKm()
    {
        var distance = 500m;
        var weight = 10000m;

        var tirResult = _sut.Calculate(distance, weight, VehicleCategory.Tir);
        var kamyonResult = _sut.Calculate(distance, weight, VehicleCategory.Kamyon);
        var kamyonetResult = _sut.Calculate(distance, weight, VehicleCategory.Kamyonet);

        tirResult.CO2Kg.Should().BeLessThan(kamyonResult.CO2Kg);
        kamyonResult.CO2Kg.Should().BeLessThan(kamyonetResult.CO2Kg);
    }

    [Fact]
    public void Calculate_FrigorifkHigherThanKamyon()
    {
        var distance = 400m;
        var weight = 8000m;

        var frigoResult = _sut.Calculate(distance, weight, VehicleCategory.Frigorifik);
        var kamyonResult = _sut.Calculate(distance, weight, VehicleCategory.Kamyon);

        // Frigorifik 0.180 > Kamyon 0.150
        frigoResult.CO2Kg.Should().BeGreaterThan(kamyonResult.CO2Kg);
    }

    [Fact]
    public void Calculate_LinearWithDistance()
    {
        var weight = 10000m;
        var vehicle = VehicleCategory.Tir;

        var result100 = _sut.Calculate(100, weight, vehicle);
        var result200 = _sut.Calculate(200, weight, vehicle);

        result200.CO2Kg.Should().Be(result100.CO2Kg * 2);
    }

    [Fact]
    public void Calculate_LinearWithWeight()
    {
        var distance = 500m;
        var vehicle = VehicleCategory.Kamyon;

        var result5000 = _sut.Calculate(distance, 5000, vehicle);
        var result10000 = _sut.Calculate(distance, 10000, vehicle);

        result10000.CO2Kg.Should().Be(result5000.CO2Kg * 2);
    }

    [Fact]
    public void Calculate_RealisticIstanbulAnkara_ReasonableValues()
    {
        // Istanbul-Ankara ~450km, 20 ton TIR yuku
        var result = _sut.Calculate(450, 20000, VehicleCategory.Tir);

        // 450 * 20 * 0.062 = 558 kg CO2
        result.CO2Kg.Should().BeInRange(500, 600);
    }

    [Fact]
    public void Calculate_SmallParcel_SmallEmission()
    {
        // 50km, 5kg parsiyel
        var result = _sut.Calculate(50, 5, VehicleCategory.Parsiyel);

        // 50 * 0.005 * 0.200 = 0.05 kg CO2
        result.CO2Kg.Should().Be(0.05m);
    }
}
