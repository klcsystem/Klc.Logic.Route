using FluentAssertions;
using Klc.LogicRoute.Application.Geocoding;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace Klc.LogicRoute.Application.Tests.Geocoding;

public class GeocodingServiceTests
{
    private readonly IGeocodingProvider _provider = Substitute.For<IGeocodingProvider>();
    private readonly ILogger<GeocodingService> _logger = Substitute.For<ILogger<GeocodingService>>();
    private readonly GeocodingService _sut;

    public GeocodingServiceTests()
    {
        _sut = new GeocodingService(_provider, _logger);
    }

    [Fact]
    public async Task EnrichOrderCoordinatesAsync_FillsOriginCoordinates()
    {
        var order = new Order
        {
            OrderNumber = "TST-001",
            OriginAddress = "Kadikoy",
            OriginCity = "Istanbul",
            OriginLat = null,
            OriginLng = null
        };

        _provider.GeocodeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new GeocodingResult(40.9869, 29.0264, "Kadikoy, Istanbul, Turkey"));

        await _sut.EnrichOrderCoordinatesAsync(order);

        order.OriginLat.Should().BeApproximately(40.9869, 0.001);
        order.OriginLng.Should().BeApproximately(29.0264, 0.001);
    }

    [Fact]
    public async Task EnrichOrderCoordinatesAsync_FillsDestinationCoordinates()
    {
        var order = new Order
        {
            OrderNumber = "TST-002",
            DestinationAddress = "Kizilay",
            DestinationCity = "Ankara",
            DestinationLat = null,
            DestinationLng = null
        };

        _provider.GeocodeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new GeocodingResult(39.9208, 32.8541, "Kizilay, Ankara, Turkey"));

        await _sut.EnrichOrderCoordinatesAsync(order);

        order.DestinationLat.Should().BeApproximately(39.9208, 0.001);
        order.DestinationLng.Should().BeApproximately(32.8541, 0.001);
    }

    [Fact]
    public async Task EnrichOrderCoordinatesAsync_SkipsWhenCoordinatesExist()
    {
        var order = new Order
        {
            OrderNumber = "TST-003",
            OriginAddress = "Kadikoy",
            OriginCity = "Istanbul",
            OriginLat = 41.0082,
            OriginLng = 28.9784,
            DestinationAddress = "Kizilay",
            DestinationCity = "Ankara",
            DestinationLat = 39.9334,
            DestinationLng = 32.8597
        };

        await _sut.EnrichOrderCoordinatesAsync(order);

        await _provider.DidNotReceive().GeocodeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task EnrichOrderCoordinatesAsync_SkipsWhenAddressIsEmpty()
    {
        var order = new Order
        {
            OrderNumber = "TST-004",
            OriginAddress = null,
            OriginLat = null
        };

        await _sut.EnrichOrderCoordinatesAsync(order);

        await _provider.DidNotReceive().GeocodeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task EnrichOrderCoordinatesAsync_SkipsWhenZeroCoordinates()
    {
        // OriginLat is 0 (treated as missing) - should geocode
        var order = new Order
        {
            OrderNumber = "TST-005",
            OriginAddress = "Kadikoy",
            OriginCity = "Istanbul",
            OriginLat = 0,
            OriginLng = 0
        };

        _provider.GeocodeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new GeocodingResult(40.9869, 29.0264));

        await _sut.EnrichOrderCoordinatesAsync(order);

        order.OriginLat.Should().NotBe(0);
    }

    [Fact]
    public async Task EnrichOrderCoordinatesAsync_HandlesNullGeocodingResult()
    {
        var order = new Order
        {
            OrderNumber = "TST-006",
            OriginAddress = "UnknownPlace",
            OriginLat = null,
            OriginLng = null
        };

        _provider.GeocodeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns((GeocodingResult?)null);

        await _sut.EnrichOrderCoordinatesAsync(order);

        order.OriginLat.Should().BeNull();
        order.OriginLng.Should().BeNull();
    }

    [Fact]
    public async Task EnrichOrderCoordinatesAsync_BuildsQueryWithCityAndCountry()
    {
        var order = new Order
        {
            OrderNumber = "TST-007",
            OriginAddress = "Organize Sanayi",
            OriginCity = "Bursa",
            OriginLat = null
        };

        _provider.GeocodeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new GeocodingResult(40.1885, 29.0610));

        await _sut.EnrichOrderCoordinatesAsync(order);

        await _provider.Received().GeocodeAsync(
            Arg.Is<string>(q => q.Contains("Bursa") && q.Contains("Turkey")),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task EnrichOrderCoordinatesAsync_BuildsQueryWithoutCity_WhenCityIsNull()
    {
        var order = new Order
        {
            OrderNumber = "TST-008",
            OriginAddress = "Some Address",
            OriginCity = null,
            OriginLat = null
        };

        _provider.GeocodeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new GeocodingResult(39.0, 32.0));

        await _sut.EnrichOrderCoordinatesAsync(order);

        await _provider.Received().GeocodeAsync(
            Arg.Is<string>(q => q.Contains("Turkey") && !q.Contains(","  + " , ")),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task EnrichOrderCoordinatesAsync_EnrichesBothOriginAndDestination()
    {
        var order = new Order
        {
            OrderNumber = "TST-009",
            OriginAddress = "Kadikoy",
            OriginCity = "Istanbul",
            OriginLat = null,
            DestinationAddress = "Kizilay",
            DestinationCity = "Ankara",
            DestinationLat = null
        };

        _provider.GeocodeAsync(Arg.Is<string>(q => q.Contains("Istanbul")), Arg.Any<CancellationToken>())
            .Returns(new GeocodingResult(41.0082, 28.9784));
        _provider.GeocodeAsync(Arg.Is<string>(q => q.Contains("Ankara")), Arg.Any<CancellationToken>())
            .Returns(new GeocodingResult(39.9334, 32.8597));

        await _sut.EnrichOrderCoordinatesAsync(order);

        order.OriginLat.Should().NotBeNull();
        order.DestinationLat.Should().NotBeNull();
        await _provider.Received(2).GeocodeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}
