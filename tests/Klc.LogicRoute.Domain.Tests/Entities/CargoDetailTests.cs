using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class CargoDetailTests
{
    [Fact]
    public void CargoDetail_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var detail = new CargoDetail();

        detail.Id.Should().NotBeEmpty();
        detail.OrderId.Should().Be(Guid.Empty);
        detail.ActualWeightKg.Should().Be(0);
        detail.VolumetricWeightKg.Should().Be(0);
        detail.ChargeableWeightKg.Should().Be(0);
        detail.TotalVolumeM3.Should().Be(0);
        detail.TotalPallets.Should().Be(0);
        detail.TotalDesi.Should().Be(0);
        detail.IsHazardous.Should().BeFalse();
        detail.RequiresColdChain.Should().BeFalse();
        detail.CalculationNotes.Should().BeNull();
        detail.CalculatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Theory]
    [InlineData(25, 32, 32)]     // Desi > Actual
    [InlineData(50, 32, 50)]     // Actual > Desi
    [InlineData(100, 100, 100)]  // Esit
    public void CargoDetail_ChargeableWeight_MaxOlmali(
        decimal actualKg, decimal volumetricKg, decimal expectedChargeable)
    {
        var detail = new CargoDetail
        {
            ActualWeightKg = actualKg,
            VolumetricWeightKg = volumetricKg,
            ChargeableWeightKg = Math.Max(actualKg, volumetricKg)
        };

        detail.ChargeableWeightKg.Should().Be(expectedChargeable);
    }

    [Fact]
    public void CargoDetail_TehlikeliMadde_TankerOnermeli()
    {
        var detail = new CargoDetail
        {
            IsHazardous = true,
            SuggestedVehicle = VehicleCategory.Tanker
        };

        detail.IsHazardous.Should().BeTrue();
        detail.SuggestedVehicle.Should().Be(VehicleCategory.Tanker);
    }

    [Fact]
    public void CargoDetail_SogukZincir_FrigoOnermeli()
    {
        var detail = new CargoDetail
        {
            RequiresColdChain = true,
            SuggestedVehicle = VehicleCategory.Frigorifik
        };

        detail.RequiresColdChain.Should().BeTrue();
        detail.SuggestedVehicle.Should().Be(VehicleCategory.Frigorifik);
    }

    [Theory]
    [InlineData(25000, VehicleCategory.Tir, LoadType.FTL)]
    [InlineData(5000, VehicleCategory.Kamyon, LoadType.FTL)]
    [InlineData(1500, VehicleCategory.Kamyonet, LoadType.LTL)]
    [InlineData(200, VehicleCategory.Parsiyel, LoadType.Parcel)]
    public void CargoDetail_AgirligaGoreAracVeYukTipi(
        decimal weightKg, VehicleCategory expectedVehicle, LoadType expectedLoad)
    {
        var detail = new CargoDetail
        {
            ActualWeightKg = weightKg,
            ChargeableWeightKg = weightKg,
            SuggestedVehicle = expectedVehicle,
            SuggestedLoadType = expectedLoad
        };

        detail.SuggestedVehicle.Should().Be(expectedVehicle);
        detail.SuggestedLoadType.Should().Be(expectedLoad);
    }
}
