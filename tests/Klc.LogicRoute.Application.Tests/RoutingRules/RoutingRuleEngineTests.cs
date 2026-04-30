using FluentAssertions;
using NSubstitute;
using Klc.LogicRoute.Application.RoutingRules;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.Tests.RoutingRules;

public class RoutingRuleEngineTests
{
    private readonly IRoutingRuleRepository _ruleRepo;
    private readonly RoutingRuleEngine _engine;
    private readonly Guid _tenantId = Guid.NewGuid();

    public RoutingRuleEngineTests()
    {
        _ruleRepo = Substitute.For<IRoutingRuleRepository>();
        _engine = new RoutingRuleEngine(_ruleRepo);
    }

    private static Order CreateTestOrder(
        string originCity = "Istanbul",
        string destinationCity = "Ankara",
        decimal weightKg = 5000,
        bool isHazardous = false,
        bool requiresColdChain = false)
    {
        return new Order
        {
            OriginCity = originCity,
            DestinationCity = destinationCity,
            TotalWeightKg = weightKg,
            IsHazardous = isHazardous,
            RequiresColdChain = requiresColdChain
        };
    }

    [Fact]
    public async Task FindMatchingRule_BolgeEslesiyor_KuralDonmeli()
    {
        var providerId = Guid.NewGuid();
        var rules = new List<RoutingRule>
        {
            new()
            {
                Name = "Istanbul-Ankara",
                OriginRegion = "Istanbul",
                DestinationRegion = "Ankara",
                PreferredProviderId = providerId,
                Priority = 1,
                IsActive = true
            }
        };

        _ruleRepo.GetAllAsync(_tenantId).Returns(rules);
        var order = CreateTestOrder("Istanbul", "Ankara");

        var result = await _engine.FindMatchingRuleAsync(order, _tenantId);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Istanbul-Ankara");
        result.PreferredProviderId.Should().Be(providerId);
    }

    [Fact]
    public async Task FindMatchingRule_BolgeEslesmez_NullDonmeli()
    {
        var rules = new List<RoutingRule>
        {
            new()
            {
                Name = "Izmir-Bursa",
                OriginRegion = "Izmir",
                DestinationRegion = "Bursa",
                Priority = 1,
                IsActive = true
            }
        };

        _ruleRepo.GetAllAsync(_tenantId).Returns(rules);
        var order = CreateTestOrder("Istanbul", "Ankara");

        var result = await _engine.FindMatchingRuleAsync(order, _tenantId);

        result.Should().BeNull();
    }

    [Fact]
    public async Task FindMatchingRule_WildcardBolge_TumSiparislereEslesmeli()
    {
        var rules = new List<RoutingRule>
        {
            new()
            {
                Name = "Genel Kural",
                OriginRegion = "*",
                DestinationRegion = "*",
                Priority = 99,
                IsActive = true
            }
        };

        _ruleRepo.GetAllAsync(_tenantId).Returns(rules);
        var order = CreateTestOrder("Antalya", "Trabzon");

        var result = await _engine.FindMatchingRuleAsync(order, _tenantId);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Genel Kural");
    }

    [Fact]
    public async Task FindMatchingRule_AgirlikAraligi_EslesmeliVeDisindaKalanlariReddetmeli()
    {
        var rules = new List<RoutingRule>
        {
            new()
            {
                Name = "Agir Yuk",
                MinWeightKg = 10000,
                MaxWeightKg = 25000,
                Priority = 1,
                IsActive = true
            }
        };

        _ruleRepo.GetAllAsync(_tenantId).Returns(rules);

        var heavyOrder = CreateTestOrder(weightKg: 15000);
        var lightOrder = CreateTestOrder(weightKg: 5000);

        var heavyResult = await _engine.FindMatchingRuleAsync(heavyOrder, _tenantId);
        var lightResult = await _engine.FindMatchingRuleAsync(lightOrder, _tenantId);

        heavyResult.Should().NotBeNull();
        lightResult.Should().BeNull();
    }

    [Fact]
    public async Task FindMatchingRule_TehlikeliMadde_SadeceHazardousEslesmeli()
    {
        var rules = new List<RoutingRule>
        {
            new()
            {
                Name = "ADR Kurali",
                IsHazardous = true,
                Priority = 0,
                IsActive = true
            }
        };

        _ruleRepo.GetAllAsync(_tenantId).Returns(rules);

        var hazOrder = CreateTestOrder(isHazardous: true);
        var normalOrder = CreateTestOrder(isHazardous: false);

        var hazResult = await _engine.FindMatchingRuleAsync(hazOrder, _tenantId);
        var normalResult = await _engine.FindMatchingRuleAsync(normalOrder, _tenantId);

        hazResult.Should().NotBeNull();
        normalResult.Should().BeNull();
    }

    [Fact]
    public async Task FindMatchingRule_SogukZincir_SadeceColdChainEslesmeli()
    {
        var rules = new List<RoutingRule>
        {
            new()
            {
                Name = "Frigo Kurali",
                RequiresColdChain = true,
                Priority = 0,
                IsActive = true
            }
        };

        _ruleRepo.GetAllAsync(_tenantId).Returns(rules);

        var coldOrder = CreateTestOrder(requiresColdChain: true);
        var normalOrder = CreateTestOrder(requiresColdChain: false);

        var coldResult = await _engine.FindMatchingRuleAsync(coldOrder, _tenantId);
        var normalResult = await _engine.FindMatchingRuleAsync(normalOrder, _tenantId);

        coldResult.Should().NotBeNull();
        normalResult.Should().BeNull();
    }

    [Fact]
    public async Task FindMatchingRule_PrioritySirasina_GoreIlkEslesenDonmeli()
    {
        var rules = new List<RoutingRule>
        {
            new()
            {
                Name = "Genel Kural",
                OriginRegion = "*",
                DestinationRegion = "*",
                Priority = 99,
                IsActive = true
            },
            new()
            {
                Name = "Istanbul-Ankara Ozel",
                OriginRegion = "Istanbul",
                DestinationRegion = "Ankara",
                Priority = 1,
                IsActive = true
            }
        };

        _ruleRepo.GetAllAsync(_tenantId).Returns(rules);
        var order = CreateTestOrder("Istanbul", "Ankara");

        var result = await _engine.FindMatchingRuleAsync(order, _tenantId);

        result.Should().NotBeNull();
        result!.Name.Should().Be("Istanbul-Ankara Ozel", "dusuk priority daha once eslesmeli");
    }

    [Fact]
    public async Task FindMatchingRule_PasifKural_Atlanmali()
    {
        var rules = new List<RoutingRule>
        {
            new()
            {
                Name = "Pasif Kural",
                OriginRegion = "Istanbul",
                DestinationRegion = "Ankara",
                Priority = 1,
                IsActive = false
            }
        };

        _ruleRepo.GetAllAsync(_tenantId).Returns(rules);
        var order = CreateTestOrder("Istanbul", "Ankara");

        var result = await _engine.FindMatchingRuleAsync(order, _tenantId);

        result.Should().BeNull();
    }

    [Fact]
    public async Task FindMatchingRule_HicKuralYok_NullDonmeli()
    {
        _ruleRepo.GetAllAsync(_tenantId).Returns(new List<RoutingRule>());
        var order = CreateTestOrder();

        var result = await _engine.FindMatchingRuleAsync(order, _tenantId);

        result.Should().BeNull();
    }

    [Fact]
    public async Task FindMatchingRule_CaseInsensitiveBolgeEslesme()
    {
        var rules = new List<RoutingRule>
        {
            new()
            {
                Name = "istanbul-ankara",
                OriginRegion = "istanbul",
                DestinationRegion = "ankara",
                Priority = 1,
                IsActive = true
            }
        };

        _ruleRepo.GetAllAsync(_tenantId).Returns(rules);
        var order = CreateTestOrder("Istanbul", "Ankara");

        var result = await _engine.FindMatchingRuleAsync(order, _tenantId);

        result.Should().NotBeNull("bolge eslesmesi case-insensitive olmali");
    }
}
