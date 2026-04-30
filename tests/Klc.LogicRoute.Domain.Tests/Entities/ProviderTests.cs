using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class ProviderTests
{
    [Fact]
    public void Provider_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var provider = new Provider();

        provider.Id.Should().NotBeEmpty();
        provider.Code.Should().BeEmpty();
        provider.Name.Should().BeEmpty();
        provider.Type.Should().Be(ProviderType.DirectCarrier);
        provider.IsActive.Should().BeTrue();
        provider.IsGlobal.Should().BeFalse();
        provider.IsDeleted.Should().BeFalse();
        provider.Contracts.Should().BeEmpty();
    }

    [Theory]
    [InlineData(ProviderType.Platform)]
    [InlineData(ProviderType.DirectCarrier)]
    public void Provider_TumProviderTypeDegerleriAtanabilmeli(ProviderType type)
    {
        var provider = new Provider { Type = type };
        provider.Type.Should().Be(type);
    }

    [Fact]
    public void Provider_TumAlanlarAtanabilmeli()
    {
        var provider = new Provider
        {
            Code = "PVD-001",
            Name = "Aras Kargo",
            Type = ProviderType.DirectCarrier,
            TaxNumber = "1234567890",
            Address = "Istanbul Merkez",
            City = "Istanbul",
            Phone = "+905551234567",
            Email = "info@araskargo.com",
            ContactPerson = "Ahmet Yilmaz",
            IsActive = true,
            ServiceRegions = "Marmara,Ic Anadolu",
            SupportedVehicleTypes = "Tir,Kamyon,Parsiyel"
        };

        provider.Code.Should().Be("PVD-001");
        provider.ServiceRegions.Should().Contain("Marmara");
        provider.SupportedVehicleTypes.Should().Contain("Tir");
    }

    [Fact]
    public void Provider_ApiEntegrasyonuAtanabilmeli()
    {
        var provider = new Provider
        {
            Type = ProviderType.Platform,
            ApiBaseUrl = "https://api.provider.com",
            ApiKey = "key-123",
            ApiSecret = "secret-456"
        };

        provider.Type.Should().Be(ProviderType.Platform);
        provider.ApiBaseUrl.Should().Be("https://api.provider.com");
    }

    [Fact]
    public void Provider_ContractEklenebilmeli()
    {
        var provider = new Provider { Name = "Test" };
        var contract = new Contract { ProviderId = provider.Id };

        provider.Contracts.Add(contract);

        provider.Contracts.Should().HaveCount(1);
    }

    [Fact]
    public void Provider_BaseEntityOzellikleriMirasAlmali()
    {
        var provider = new Provider();

        provider.TenantId.Should().Be(Guid.Empty);
        provider.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
    }
}
