using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class ContractRateTests
{
    [Fact]
    public void ContractRate_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var rate = new ContractRate();

        rate.Id.Should().NotBeEmpty();
        rate.ContractId.Should().Be(Guid.Empty);
        rate.OriginRegion.Should().BeNull();
        rate.DestinationRegion.Should().BeNull();
        rate.PricePerUnit.Should().Be(0);
        rate.MinWeightKg.Should().Be(0);
        rate.MaxWeightKg.Should().Be(0);
        rate.Currency.Should().Be("TRY");
        rate.IsActive.Should().BeTrue();
        rate.UrgentSurchargePercent.Should().BeNull();
        rate.AdrSurchargePercent.Should().BeNull();
        rate.FrigoSurchargePercent.Should().BeNull();
        rate.WeekendSurchargePercent.Should().BeNull();
    }

    [Theory]
    [InlineData(VehicleCategory.Tir)]
    [InlineData(VehicleCategory.Kamyon)]
    [InlineData(VehicleCategory.Kamyonet)]
    [InlineData(VehicleCategory.Parsiyel)]
    [InlineData(VehicleCategory.Frigorifik)]
    [InlineData(VehicleCategory.Tanker)]
    [InlineData(VehicleCategory.LowBed)]
    [InlineData(VehicleCategory.Konteyner)]
    public void ContractRate_TumVehicleCategoryDegerleriAtanabilmeli(VehicleCategory category)
    {
        var rate = new ContractRate { VehicleCategory = category };
        rate.VehicleCategory.Should().Be(category);
    }

    [Theory]
    [InlineData(PricingUnit.PerKg)]
    [InlineData(PricingUnit.PerM3)]
    [InlineData(PricingUnit.PerPallet)]
    [InlineData(PricingUnit.PerTrip)]
    [InlineData(PricingUnit.PerKm)]
    [InlineData(PricingUnit.FlatRate)]
    [InlineData(PricingUnit.PerContainer)]
    public void ContractRate_TumPricingUnitDegerleriAtanabilmeli(PricingUnit unit)
    {
        var rate = new ContractRate { PricingUnit = unit };
        rate.PricingUnit.Should().Be(unit);
    }

    [Fact]
    public void ContractRate_AgirlikAraligiAtanabilmeli()
    {
        var rate = new ContractRate
        {
            MinWeightKg = 100,
            MaxWeightKg = 5000,
            PricePerUnit = 3.50m
        };

        rate.MinWeightKg.Should().Be(100);
        rate.MaxWeightKg.Should().Be(5000);
    }

    [Fact]
    public void ContractRate_SurchargeAtanabilmeli()
    {
        var rate = new ContractRate
        {
            UrgentSurchargePercent = 25,
            AdrSurchargePercent = 30,
            FrigoSurchargePercent = 20,
            WeekendSurchargePercent = 15
        };

        rate.UrgentSurchargePercent.Should().Be(25);
        rate.AdrSurchargePercent.Should().Be(30);
        rate.FrigoSurchargePercent.Should().Be(20);
        rate.WeekendSurchargePercent.Should().Be(15);
    }

    [Theory]
    [InlineData(1000, 3.50, 3500)]       // 1000 kg x 3.50 TL/kg
    [InlineData(500, 5.00, 2500)]        // 500 kg x 5.00 TL/kg
    [InlineData(2500, 2.80, 7000)]       // 2500 kg x 2.80 TL/kg
    public void TarifeFiyatHesaplama_PerKg_DogruOlmali(decimal weightKg, decimal pricePerKg, decimal expectedTotal)
    {
        var total = weightKg * pricePerKg;
        total.Should().Be(expectedTotal);
    }

    [Theory]
    [InlineData(1000, 3.50, 25, 4375)]   // 1000x3.50 = 3500, +25% = 4375
    [InlineData(1000, 3.50, 30, 4550)]   // 1000x3.50 = 3500, +30% = 4550
    [InlineData(1000, 3.50, 0, 3500)]    // surcharge yok
    public void SurchargeHesaplama_DogruOlmali(decimal weightKg, decimal pricePerKg, decimal surchargePercent, decimal expectedTotal)
    {
        var baseTotal = weightKg * pricePerKg;
        var total = baseTotal * (1 + surchargePercent / 100m);
        total.Should().Be(expectedTotal);
    }

    [Fact]
    public void ContractRate_BolgeselTarifAtanabilmeli()
    {
        var rate = new ContractRate
        {
            OriginRegion = "Marmara",
            DestinationRegion = "Ic Anadolu",
            VehicleCategory = VehicleCategory.Tir,
            PricePerUnit = 2.00m,
            PricingUnit = PricingUnit.PerKg
        };

        rate.OriginRegion.Should().Be("Marmara");
        rate.DestinationRegion.Should().Be("Ic Anadolu");
    }
}
