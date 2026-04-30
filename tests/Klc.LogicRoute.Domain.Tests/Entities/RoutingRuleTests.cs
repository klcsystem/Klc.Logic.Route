using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class RoutingRuleTests
{
    [Fact]
    public void RoutingRule_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var rule = new RoutingRule();

        rule.Id.Should().NotBeEmpty();
        rule.Name.Should().BeEmpty();
        rule.Description.Should().BeNull();
        rule.Priority.Should().Be(0);
        rule.IsActive.Should().BeTrue();
        rule.OriginRegion.Should().BeNull();
        rule.DestinationRegion.Should().BeNull();
        rule.VehicleCategory.Should().BeNull();
        rule.MinWeightKg.Should().BeNull();
        rule.MaxWeightKg.Should().BeNull();
        rule.IsHazardous.Should().BeNull();
        rule.RequiresColdChain.Should().BeNull();
        rule.PreferredProviderId.Should().BeNull();
        rule.PreferredContractId.Should().BeNull();
        rule.Action.Should().BeNull();
    }

    [Fact]
    public void RoutingRule_BolgeKuraliTanimlabilmeli()
    {
        var providerId = Guid.NewGuid();
        var rule = new RoutingRule
        {
            Name = "Istanbul-Ankara Tir",
            OriginRegion = "Istanbul",
            DestinationRegion = "Ankara",
            VehicleCategory = VehicleCategory.Tir,
            MinWeightKg = 10000,
            MaxWeightKg = 25000,
            PreferredProviderId = providerId,
            Priority = 1,
            IsActive = true
        };

        rule.OriginRegion.Should().Be("Istanbul");
        rule.DestinationRegion.Should().Be("Ankara");
        rule.VehicleCategory.Should().Be(VehicleCategory.Tir);
        rule.MinWeightKg.Should().Be(10000);
        rule.PreferredProviderId.Should().Be(providerId);
    }

    [Fact]
    public void RoutingRule_TehlikeliMaddeKuraliTanimlabilmeli()
    {
        var rule = new RoutingRule
        {
            Name = "ADR Kargo Kurali",
            IsHazardous = true,
            VehicleCategory = VehicleCategory.Tanker,
            Action = "RequireADRCertificate",
            Priority = 0
        };

        rule.IsHazardous.Should().BeTrue();
        rule.VehicleCategory.Should().Be(VehicleCategory.Tanker);
        rule.Action.Should().Be("RequireADRCertificate");
    }

    [Fact]
    public void RoutingRule_SogukZincirKuraliTanimlabilmeli()
    {
        var rule = new RoutingRule
        {
            Name = "Soguk Zincir Kurali",
            RequiresColdChain = true,
            VehicleCategory = VehicleCategory.Frigorifik,
            Priority = 0
        };

        rule.RequiresColdChain.Should().BeTrue();
        rule.VehicleCategory.Should().Be(VehicleCategory.Frigorifik);
    }

    [Fact]
    public void RoutingRule_WildcardBolgeTanimlabilmeli()
    {
        var rule = new RoutingRule
        {
            Name = "Tum Bolgeler",
            OriginRegion = "*",
            DestinationRegion = "*",
            Priority = 99
        };

        rule.OriginRegion.Should().Be("*");
        rule.DestinationRegion.Should().Be("*");
    }
}
