using FluentAssertions;
using Klc.LogicRoute.Application.CargoCalculation;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Application.Tests.CargoCalculation;

public class CargoCalculationServiceTests
{
    private readonly CargoCalculationService _sut = new();

    private static Order CreateOrder(
        decimal totalWeightKg = 5000,
        decimal totalVolumeM3 = 10,
        int palletCount = 5,
        bool coldChain = false,
        bool hazardous = false,
        List<OrderLine>? lines = null)
    {
        return new Order
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            OrderNumber = "TST-001",
            TotalWeightKg = totalWeightKg,
            TotalVolumeM3 = totalVolumeM3,
            PalletCount = palletCount,
            RequiresColdChain = coldChain,
            IsHazardous = hazardous,
            Lines = lines ?? []
        };
    }

    [Fact]
    public void Calculate_StandardOrder_ReturnsCorrectChargeableWeight()
    {
        // Volumetric = 10 * 333 = 3330, Actual = 5000 => chargeable = 5000
        var order = CreateOrder(totalWeightKg: 5000, totalVolumeM3: 10);
        var result = _sut.Calculate(order);

        result.ActualWeightKg.Should().Be(5000);
        result.VolumetricWeightKg.Should().Be(3330);
        result.ChargeableWeightKg.Should().Be(5000); // actual > volumetric
    }

    [Fact]
    public void Calculate_VolumetricHeavier_UsesVolumetricWeight()
    {
        // Volumetric = 20 * 333 = 6660, Actual = 2000 => chargeable = 6660
        var order = CreateOrder(totalWeightKg: 2000, totalVolumeM3: 20);
        var result = _sut.Calculate(order);

        result.ChargeableWeightKg.Should().Be(6660);
        result.CalculationNotes.Should().Contain("Hacimsel");
    }

    [Fact]
    public void Calculate_ColdChain_SuggestsFrigorifik()
    {
        var order = CreateOrder(coldChain: true);
        var result = _sut.Calculate(order);

        result.SuggestedVehicle.Should().Be(VehicleCategory.Frigorifik);
        result.RequiresColdChain.Should().BeTrue();
    }

    [Fact]
    public void Calculate_Hazardous_SuggestsTanker()
    {
        var order = CreateOrder(hazardous: true);
        var result = _sut.Calculate(order);

        result.SuggestedVehicle.Should().Be(VehicleCategory.Tanker);
        result.IsHazardous.Should().BeTrue();
    }

    [Theory]
    [InlineData(500, VehicleCategory.Kamyonet)]   // <= 1500
    [InlineData(1500, VehicleCategory.Kamyonet)]
    [InlineData(3000, VehicleCategory.Kamyon)]     // <= 8000
    [InlineData(8000, VehicleCategory.Kamyon)]
    [InlineData(15000, VehicleCategory.Tir)]       // <= 24000
    [InlineData(24000, VehicleCategory.Tir)]
    [InlineData(30000, VehicleCategory.Tir)]       // > 24000
    public void Calculate_WeightBasedVehicleSuggestion(decimal weight, VehicleCategory expected)
    {
        var order = CreateOrder(totalWeightKg: weight, totalVolumeM3: 0);
        var result = _sut.Calculate(order);

        result.SuggestedVehicle.Should().Be(expected);
    }

    [Fact]
    public void Calculate_HeavyTir_SuggestsFTL()
    {
        // Tir + >= 20000 => FTL
        var order = CreateOrder(totalWeightKg: 22000, totalVolumeM3: 0);
        var result = _sut.Calculate(order);

        result.SuggestedVehicle.Should().Be(VehicleCategory.Tir);
        result.SuggestedLoadType.Should().Be(LoadType.FTL);
    }

    [Fact]
    public void Calculate_SmallParcel_SuggestsParcel()
    {
        // <= 100 kg, <= 1 palet => Parcel
        var order = CreateOrder(totalWeightKg: 50, totalVolumeM3: 0, palletCount: 1);
        var result = _sut.Calculate(order);

        result.SuggestedLoadType.Should().Be(LoadType.Parcel);
    }

    [Fact]
    public void Calculate_MidWeight_SuggestsLTL()
    {
        // Not FTL (Kamyon, 5000kg) and not Parcel (> 100kg)
        var order = CreateOrder(totalWeightKg: 5000, totalVolumeM3: 0, palletCount: 5);
        var result = _sut.Calculate(order);

        result.SuggestedLoadType.Should().Be(LoadType.LTL);
    }

    [Fact]
    public void Calculate_WithOrderLines_CalculatesDesi()
    {
        var lines = new List<OrderLine>
        {
            new()
            {
                WidthCm = 60, HeightCm = 40, DepthCm = 50,
                Quantity = 2
            },
            new()
            {
                WidthCm = 30, HeightCm = 20, DepthCm = 25,
                Quantity = 3
            }
        };

        var order = CreateOrder(lines: lines);
        var result = _sut.Calculate(order);

        // Line1 desi: 60*40*50/3000 * 2 = 80
        // Line2 desi: 30*20*25/3000 * 3 = 15
        result.TotalDesi.Should().Be(95);
    }

    [Fact]
    public void Calculate_EmptyLines_ZeroDesi()
    {
        var order = CreateOrder();
        var result = _sut.Calculate(order);

        result.TotalDesi.Should().Be(0);
    }

    [Fact]
    public void Calculate_ZeroDimensionLine_ZeroDesi()
    {
        var lines = new List<OrderLine>
        {
            new() { WidthCm = 0, HeightCm = 40, DepthCm = 50, Quantity = 1 }
        };

        var order = CreateOrder(lines: lines);
        var result = _sut.Calculate(order);

        result.TotalDesi.Should().Be(0);
    }

    [Fact]
    public void Calculate_SetsOrderIdAndTenantId()
    {
        var order = CreateOrder();
        var result = _sut.Calculate(order);

        result.OrderId.Should().Be(order.Id);
        result.TenantId.Should().Be(order.TenantId);
    }

    [Fact]
    public void Calculate_HazardousOrder_IncludesADRNote()
    {
        var order = CreateOrder(hazardous: true);
        var result = _sut.Calculate(order);

        result.CalculationNotes.Should().Contain("ADR");
    }

    [Fact]
    public void Calculate_ColdChainOrder_IncludesTemperatureNote()
    {
        var order = CreateOrder(coldChain: true);
        order.TemperatureMin = 2;
        order.TemperatureMax = 8;
        var result = _sut.Calculate(order);

        result.CalculationNotes.Should().Contain("Soğuk zincir");
        result.CalculationNotes.Should().Contain("2");
        result.CalculationNotes.Should().Contain("8");
    }
}
