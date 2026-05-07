using FluentAssertions;
using Klc.LogicRoute.Application.DecisionEngine;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using NSubstitute;

namespace Klc.LogicRoute.Application.Tests.DecisionEngine;

public class DecisionEngineServiceTests
{
    private readonly IContractRepository _contractRepo = Substitute.For<IContractRepository>();
    private readonly IProviderRepository _providerRepo = Substitute.For<IProviderRepository>();
    private readonly ICarrierPerformanceRepository _perfRepo = Substitute.For<ICarrierPerformanceRepository>();
    private readonly DecisionEngineService _sut;
    private readonly Guid _tenantId = Guid.NewGuid();

    public DecisionEngineServiceTests()
    {
        _sut = new DecisionEngineService(_contractRepo, _providerRepo, _perfRepo);
    }

    private static Shipment CreateShipment(
        string originCity = "Istanbul",
        string destCity = "Ankara",
        decimal chargeableWeight = 5000,
        VehicleCategory vehicle = VehicleCategory.Kamyon,
        ShipmentPriority priority = ShipmentPriority.Normal,
        bool hazardous = false,
        bool coldChain = false)
    {
        return new Shipment
        {
            Id = Guid.NewGuid(),
            ShipmentNumber = "SHP-TEST-001",
            OriginCity = originCity,
            DestinationCity = destCity,
            ChargeableWeight = chargeableWeight,
            TotalVolumeM3 = chargeableWeight / 500m,
            PalletCount = Math.Max(1, (int)(chargeableWeight / 800)),
            RecommendedVehicle = vehicle,
            Priority = priority,
            IsHazardous = hazardous,
            RequiresColdChain = coldChain
        };
    }

    private Provider CreateProvider(Guid? id = null, string name = "Test Provider", bool active = true)
    {
        return new Provider
        {
            Id = id ?? Guid.NewGuid(),
            TenantId = _tenantId,
            Name = name,
            Code = name.Replace(" ", "").ToUpperInvariant()[..Math.Min(5, name.Length)],
            IsActive = active
        };
    }

    private Contract CreateContract(Guid providerId, Guid? id = null, ContractStatus status = ContractStatus.Active)
    {
        return new Contract
        {
            Id = id ?? Guid.NewGuid(),
            TenantId = _tenantId,
            ProviderId = providerId,
            ContractNumber = "CNT-TEST",
            Status = status,
            StartDate = DateTime.UtcNow.AddMonths(-6),
            EndDate = DateTime.UtcNow.AddMonths(6)
        };
    }

    private static ContractRate CreateRate(
        Guid contractId,
        string origin = "Istanbul",
        string dest = "Ankara",
        VehicleCategory vehicle = VehicleCategory.Kamyon,
        decimal pricePerUnit = 14m,
        PricingUnit pricingUnit = PricingUnit.PerKg,
        decimal minWeight = 1000,
        decimal maxWeight = 10000)
    {
        return new ContractRate
        {
            Id = Guid.NewGuid(),
            ContractId = contractId,
            OriginRegion = origin,
            DestinationRegion = dest,
            VehicleCategory = vehicle,
            PricePerUnit = pricePerUnit,
            PricingUnit = pricingUnit,
            MinWeightKg = minWeight,
            MaxWeightKg = maxWeight,
            IsActive = true
        };
    }

    private void SetupSingleProvider(Provider provider, Contract contract, params ContractRate[] rates)
    {
        _providerRepo.GetAllAsync(_tenantId).Returns(new[] { provider });
        _contractRepo.GetAllAsync(_tenantId, Arg.Any<int>(), Arg.Any<int>()).Returns(new[] { contract });
        _contractRepo.GetRatesAsync(contract.Id).Returns(rates.AsEnumerable());
        _perfRepo.GetByProviderAsync(provider.Id, _tenantId, Arg.Any<int>(), Arg.Any<int>())
            .Returns((CarrierPerformance?)null);
    }

    [Fact]
    public async Task CalculateBestOption_SingleMatch_ReturnsRecommendation()
    {
        var provider = CreateProvider(name: "Aras");
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id, pricePerUnit: 10m, pricingUnit: PricingUnit.PerKg);

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(chargeableWeight: 5000);
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.SelectedProviderId.Should().Be(provider.Id);
        result.SelectedProviderName.Should().Be("Aras");
        result.CalculatedPrice.Should().Be(50000m); // 10 * 5000
        result.Currency.Should().Be("TRY");
    }

    [Fact]
    public async Task CalculateBestOption_NoMatchingRates_ReturnsEmptyRecommendation()
    {
        var provider = CreateProvider(name: "Aras");
        var contract = CreateContract(provider.Id);
        // Rate for Izmir-Bursa, but shipment is Istanbul-Ankara
        var rate = CreateRate(contract.Id, origin: "Izmir", dest: "Bursa");

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(originCity: "Istanbul", destCity: "Ankara");
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.Explanation.Should().Contain("bulunamadi");
        result.CalculatedPrice.Should().Be(0);
    }

    [Fact]
    public async Task CalculateBestOption_InactiveProvider_Skipped()
    {
        var provider = CreateProvider(name: "InactiveProvider", active: false);
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id);

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment();
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.Explanation.Should().Contain("bulunamadi");
    }

    [Fact]
    public async Task CalculateBestOption_ExpiredContract_Skipped()
    {
        var provider = CreateProvider(name: "Aras");
        var contract = CreateContract(provider.Id, status: ContractStatus.Expired);
        contract.StartDate = DateTime.UtcNow.AddMonths(-12);
        contract.EndDate = DateTime.UtcNow.AddMonths(-6);
        var rate = CreateRate(contract.Id);

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment();
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.Explanation.Should().Contain("bulunamadi");
    }

    [Fact]
    public async Task CalculateBestOption_TwoProviders_CheapestWinsWithPriceWeight()
    {
        var cheapProvider = CreateProvider(name: "Ucuz Kargo");
        var expensiveProvider = CreateProvider(name: "Pahali Kargo");

        var cheapContract = CreateContract(cheapProvider.Id);
        var expensiveContract = CreateContract(expensiveProvider.Id);

        var cheapRate = CreateRate(cheapContract.Id, pricePerUnit: 8m);
        var expensiveRate = CreateRate(expensiveContract.Id, pricePerUnit: 15m);

        _providerRepo.GetAllAsync(_tenantId).Returns(new[] { cheapProvider, expensiveProvider });
        _contractRepo.GetAllAsync(_tenantId, Arg.Any<int>(), Arg.Any<int>())
            .Returns(new[] { cheapContract, expensiveContract });
        _contractRepo.GetRatesAsync(cheapContract.Id).Returns(new[] { cheapRate }.AsEnumerable());
        _contractRepo.GetRatesAsync(expensiveContract.Id).Returns(new[] { expensiveRate }.AsEnumerable());
        _perfRepo.GetByProviderAsync(Arg.Any<Guid>(), _tenantId, Arg.Any<int>(), Arg.Any<int>())
            .Returns((CarrierPerformance?)null);

        var shipment = CreateShipment(chargeableWeight: 5000);
        var criteria = new DecisionCriteria { PriceWeight = 0.9m, SpeedWeight = 0.05m, ReliabilityWeight = 0.05m };

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.SelectedProviderName.Should().Be("Ucuz Kargo");
        result.CalculatedPrice.Should().Be(40000m); // 8 * 5000
        result.SavingsAmount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CalculateBestOption_ReliableProviderWins_WithReliabilityWeight()
    {
        var reliableProvider = CreateProvider(name: "Guvenilir");
        var cheapProvider = CreateProvider(name: "Ucuz");

        var reliableContract = CreateContract(reliableProvider.Id);
        var cheapContract = CreateContract(cheapProvider.Id);

        // Cheap provider has lower price
        var reliableRate = CreateRate(reliableContract.Id, pricePerUnit: 12m);
        var cheapRate = CreateRate(cheapContract.Id, pricePerUnit: 10m);

        _providerRepo.GetAllAsync(_tenantId).Returns(new[] { reliableProvider, cheapProvider });
        _contractRepo.GetAllAsync(_tenantId, Arg.Any<int>(), Arg.Any<int>())
            .Returns(new[] { reliableContract, cheapContract });
        _contractRepo.GetRatesAsync(reliableContract.Id).Returns(new[] { reliableRate }.AsEnumerable());
        _contractRepo.GetRatesAsync(cheapContract.Id).Returns(new[] { cheapRate }.AsEnumerable());

        // Reliable provider has much better performance
        _perfRepo.GetByProviderAsync(reliableProvider.Id, _tenantId, Arg.Any<int>(), Arg.Any<int>())
            .Returns(new CarrierPerformance { OnTimePercentage = 98m });
        _perfRepo.GetByProviderAsync(cheapProvider.Id, _tenantId, Arg.Any<int>(), Arg.Any<int>())
            .Returns(new CarrierPerformance { OnTimePercentage = 50m });

        var shipment = CreateShipment(chargeableWeight: 5000);
        // Heavily weight reliability
        var criteria = new DecisionCriteria { PriceWeight = 0.1m, SpeedWeight = 0.1m, ReliabilityWeight = 0.8m };

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.SelectedProviderName.Should().Be("Guvenilir");
        result.Reason.Should().Be(RecommendationReason.BestPerformance);
    }

    [Fact]
    public async Task CalculateBestOption_UrgentSurcharge_Applied()
    {
        var provider = CreateProvider(name: "Aras");
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id, pricePerUnit: 10m);
        rate.UrgentSurchargePercent = 25m;

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(chargeableWeight: 1000, priority: ShipmentPriority.Urgent);
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        // Base: 10 * 1000 = 10000, Urgent: +25% = 12500
        result.CalculatedPrice.Should().Be(12500m);
    }

    [Fact]
    public async Task CalculateBestOption_HazardousSurcharge_Applied()
    {
        var provider = CreateProvider(name: "ADR Kargo");
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id, pricePerUnit: 10m);
        rate.AdrSurchargePercent = 30m;

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(chargeableWeight: 1000, hazardous: true);
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        // Base: 10000, ADR: +30% = 13000
        result.CalculatedPrice.Should().Be(13000m);
    }

    [Fact]
    public async Task CalculateBestOption_ColdChainSurcharge_Applied()
    {
        var provider = CreateProvider(name: "Frigo Kargo");
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id, pricePerUnit: 10m, vehicle: VehicleCategory.Frigorifik);
        rate.FrigoSurchargePercent = 35m;

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(chargeableWeight: 1000, vehicle: VehicleCategory.Frigorifik, coldChain: true);
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        // Base: 10000, Frigo: +35% = 13500
        result.CalculatedPrice.Should().Be(13500m);
    }

    [Fact]
    public async Task CalculateBestOption_PerTripPricing_FixedPrice()
    {
        var provider = CreateProvider(name: "Sabit Fiyat");
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id, pricePerUnit: 8000m, pricingUnit: PricingUnit.PerTrip);

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(chargeableWeight: 5000);
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.CalculatedPrice.Should().Be(8000m); // Fixed per trip
    }

    [Fact]
    public async Task CalculateBestOption_PerM3Pricing_CalculatedByVolume()
    {
        var provider = CreateProvider(name: "Hacim Kargo");
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id, pricePerUnit: 500m, pricingUnit: PricingUnit.PerM3);

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(chargeableWeight: 5000); // volume = 5000/500 = 10 m3
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.CalculatedPrice.Should().Be(5000m); // 500 * 10
    }

    [Fact]
    public async Task CalculateBestOption_WeightOutOfRange_NotMatched()
    {
        var provider = CreateProvider(name: "Aras");
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id, minWeight: 10000, maxWeight: 25000);

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(chargeableWeight: 5000); // Below min
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.Explanation.Should().Contain("bulunamadi");
    }

    [Fact]
    public async Task CalculateBestOption_WildcardRegion_MatchesAll()
    {
        var provider = CreateProvider(name: "Genel Kargo");
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id, origin: "*", dest: "*", pricePerUnit: 12m);

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(originCity: "Trabzon", destCity: "Antalya", chargeableWeight: 5000);
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.SelectedProviderName.Should().Be("Genel Kargo");
        result.CalculatedPrice.Should().Be(60000m); // 12 * 5000
    }

    [Fact]
    public async Task CalculateBestOption_MultipleSurcharges_Cumulative()
    {
        var provider = CreateProvider(name: "Multi Surcharge");
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id, pricePerUnit: 10m, vehicle: VehicleCategory.Frigorifik);
        rate.UrgentSurchargePercent = 20m;
        rate.FrigoSurchargePercent = 30m;

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(
            chargeableWeight: 1000,
            vehicle: VehicleCategory.Frigorifik,
            priority: ShipmentPriority.Urgent,
            coldChain: true);
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        // Base: 10000, Urgent: +2000, Frigo: +3000 = 15000
        result.CalculatedPrice.Should().Be(15000m);
    }

    [Fact]
    public async Task CalculateBestOption_PriceWeightHigh_ReturnsCheapestPriceReason()
    {
        var p1 = CreateProvider(name: "P1");
        var p2 = CreateProvider(name: "P2");
        var c1 = CreateContract(p1.Id);
        var c2 = CreateContract(p2.Id);
        var r1 = CreateRate(c1.Id, pricePerUnit: 8m);
        var r2 = CreateRate(c2.Id, pricePerUnit: 12m);

        _providerRepo.GetAllAsync(_tenantId).Returns(new[] { p1, p2 });
        _contractRepo.GetAllAsync(_tenantId, Arg.Any<int>(), Arg.Any<int>()).Returns(new[] { c1, c2 });
        _contractRepo.GetRatesAsync(c1.Id).Returns(new[] { r1 }.AsEnumerable());
        _contractRepo.GetRatesAsync(c2.Id).Returns(new[] { r2 }.AsEnumerable());
        _perfRepo.GetByProviderAsync(Arg.Any<Guid>(), _tenantId, Arg.Any<int>(), Arg.Any<int>())
            .Returns((CarrierPerformance?)null);

        var shipment = CreateShipment(chargeableWeight: 5000);
        var criteria = new DecisionCriteria { PriceWeight = 0.8m, SpeedWeight = 0.1m, ReliabilityWeight = 0.1m };

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.Reason.Should().Be(RecommendationReason.CheapestPrice);
    }

    [Fact]
    public async Task CalculateBestOption_AlternativesPopulated_WhenMultipleCandidates()
    {
        var p1 = CreateProvider(name: "Best");
        var p2 = CreateProvider(name: "Alt1");
        var p3 = CreateProvider(name: "Alt2");
        var c1 = CreateContract(p1.Id);
        var c2 = CreateContract(p2.Id);
        var c3 = CreateContract(p3.Id);
        var r1 = CreateRate(c1.Id, pricePerUnit: 8m);
        var r2 = CreateRate(c2.Id, pricePerUnit: 10m);
        var r3 = CreateRate(c3.Id, pricePerUnit: 12m);

        _providerRepo.GetAllAsync(_tenantId).Returns(new[] { p1, p2, p3 });
        _contractRepo.GetAllAsync(_tenantId, Arg.Any<int>(), Arg.Any<int>()).Returns(new[] { c1, c2, c3 });
        _contractRepo.GetRatesAsync(c1.Id).Returns(new[] { r1 }.AsEnumerable());
        _contractRepo.GetRatesAsync(c2.Id).Returns(new[] { r2 }.AsEnumerable());
        _contractRepo.GetRatesAsync(c3.Id).Returns(new[] { r3 }.AsEnumerable());
        _perfRepo.GetByProviderAsync(Arg.Any<Guid>(), _tenantId, Arg.Any<int>(), Arg.Any<int>())
            .Returns((CarrierPerformance?)null);

        var shipment = CreateShipment(chargeableWeight: 5000);
        var criteria = new DecisionCriteria { PriceWeight = 0.9m, SpeedWeight = 0.05m, ReliabilityWeight = 0.05m };

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        result.AlternativeProviderId1.Should().NotBeNull();
        result.AlternativePrice1.Should().NotBeNull();
        result.AlternativeProviderId2.Should().NotBeNull();
        result.AlternativePrice2.Should().NotBeNull();
    }

    [Fact]
    public async Task CalculateBestOption_SavingsCalculation_Correct()
    {
        var p1 = CreateProvider(name: "Cheap");
        var p2 = CreateProvider(name: "Expensive");
        var c1 = CreateContract(p1.Id);
        var c2 = CreateContract(p2.Id);
        var r1 = CreateRate(c1.Id, pricePerUnit: 8m);
        var r2 = CreateRate(c2.Id, pricePerUnit: 16m);

        _providerRepo.GetAllAsync(_tenantId).Returns(new[] { p1, p2 });
        _contractRepo.GetAllAsync(_tenantId, Arg.Any<int>(), Arg.Any<int>()).Returns(new[] { c1, c2 });
        _contractRepo.GetRatesAsync(c1.Id).Returns(new[] { r1 }.AsEnumerable());
        _contractRepo.GetRatesAsync(c2.Id).Returns(new[] { r2 }.AsEnumerable());
        _perfRepo.GetByProviderAsync(Arg.Any<Guid>(), _tenantId, Arg.Any<int>(), Arg.Any<int>())
            .Returns((CarrierPerformance?)null);

        var shipment = CreateShipment(chargeableWeight: 1000);
        var criteria = new DecisionCriteria { PriceWeight = 0.9m, SpeedWeight = 0.05m, ReliabilityWeight = 0.05m };

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        // Cheap: 8000, Expensive: 16000, savings = 8000, percent = 50%
        result.SavingsAmount.Should().Be(8000m);
        result.SavingsPercent.Should().Be(50m);
    }

    [Fact]
    public async Task CalculateBestOption_NoPerformanceData_DefaultReliability()
    {
        var provider = CreateProvider(name: "New Provider");
        var contract = CreateContract(provider.Id);
        var rate = CreateRate(contract.Id, pricePerUnit: 10m);

        SetupSingleProvider(provider, contract, rate);

        var shipment = CreateShipment(chargeableWeight: 1000);
        var criteria = new DecisionCriteria();

        var result = await _sut.CalculateBestOptionAsync(shipment, criteria, _tenantId);

        // Default reliability is 0.5 (50%) when no performance data
        result.ScoreReliability.Should().Be(50m);
    }
}
