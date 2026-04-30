using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class ContractTests
{
    [Fact]
    public void Contract_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var contract = new Contract();

        contract.Id.Should().NotBeEmpty();
        contract.ContractNumber.Should().BeEmpty();
        contract.Name.Should().BeNull();
        contract.ProviderId.Should().Be(Guid.Empty);
        contract.Status.Should().Be(ContractStatus.Draft);
        contract.Currency.Should().Be("TRY");
        contract.Notes.Should().BeNull();
        contract.Rates.Should().BeEmpty();
        contract.IsDeleted.Should().BeFalse();
    }

    [Theory]
    [InlineData(ContractStatus.Draft)]
    [InlineData(ContractStatus.Active)]
    [InlineData(ContractStatus.Expired)]
    [InlineData(ContractStatus.Terminated)]
    [InlineData(ContractStatus.Suspended)]
    public void Contract_TumStatusDegerleriAtanabilmeli(ContractStatus status)
    {
        var contract = new Contract { Status = status };
        contract.Status.Should().Be(status);
    }

    [Fact]
    public void Contract_TarihAraliklariAtanabilmeli()
    {
        var start = new DateTime(2026, 1, 1);
        var end = new DateTime(2026, 12, 31);

        var contract = new Contract { StartDate = start, EndDate = end };

        contract.StartDate.Should().Be(start);
        contract.EndDate.Should().Be(end);
    }

    [Fact]
    public void Contract_RateEklenebilmeli()
    {
        var contract = new Contract { ContractNumber = "CNT-001" };

        var rate = new ContractRate
        {
            ContractId = contract.Id,
            OriginRegion = "Marmara",
            DestinationRegion = "Ic Anadolu",
            VehicleCategory = VehicleCategory.Tir,
            PricePerUnit = 2.50m,
            PricingUnit = PricingUnit.PerKg,
            IsActive = true
        };

        contract.Rates.Add(rate);

        contract.Rates.Should().HaveCount(1);
        contract.Rates.First().OriginRegion.Should().Be("Marmara");
    }

    [Fact]
    public void Contract_ProviderIliskisiAtanabilmeli()
    {
        var providerId = Guid.NewGuid();
        var contract = new Contract { ProviderId = providerId };
        contract.ProviderId.Should().Be(providerId);
    }
}
