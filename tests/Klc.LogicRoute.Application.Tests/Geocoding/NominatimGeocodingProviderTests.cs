using System.Net;
using System.Text.Json;
using FluentAssertions;
using Klc.LogicRoute.Domain.Interfaces;
using Klc.LogicRoute.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace Klc.LogicRoute.Application.Tests.Geocoding;

public class NominatimGeocodingProviderTests
{
    private readonly ILogger<NominatimGeocodingProvider> _logger = Substitute.For<ILogger<NominatimGeocodingProvider>>();

    private NominatimGeocodingProvider CreateSut(HttpResponseMessage response)
    {
        var handler = new FakeHttpMessageHandler(response);
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://nominatim.openstreetmap.org/")
        };
        return new NominatimGeocodingProvider(httpClient, _logger);
    }

    #region GeocodeAsync Tests

    [Fact]
    public async Task GeocodeAsync_ValidAddress_ReturnsCoordinates()
    {
        var json = JsonSerializer.Serialize(new[]
        {
            new { lat = "41.0082", lon = "28.9784", display_name = "Istanbul, Turkey", address = new { province = "Istanbul" } }
        });
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };

        var sut = CreateSut(response);
        var result = await sut.GeocodeAsync("Istanbul");

        result.Should().NotBeNull();
        result!.Latitude.Should().BeApproximately(41.0082, 0.001);
        result.Longitude.Should().BeApproximately(28.9784, 0.001);
        result.DisplayName.Should().Be("Istanbul, Turkey");
    }

    [Fact]
    public async Task GeocodeAsync_EmptyAddress_ReturnsNull()
    {
        var sut = CreateSut(new HttpResponseMessage(HttpStatusCode.OK));
        var result = await sut.GeocodeAsync("");
        result.Should().BeNull();
    }

    [Fact]
    public async Task GeocodeAsync_WhitespaceAddress_ReturnsNull()
    {
        var sut = CreateSut(new HttpResponseMessage(HttpStatusCode.OK));
        var result = await sut.GeocodeAsync("   ");
        result.Should().BeNull();
    }

    [Fact]
    public async Task GeocodeAsync_NullAddress_ReturnsNull()
    {
        var sut = CreateSut(new HttpResponseMessage(HttpStatusCode.OK));
        var result = await sut.GeocodeAsync(null!);
        result.Should().BeNull();
    }

    [Fact]
    public async Task GeocodeAsync_NoResults_ReturnsNull()
    {
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("[]", System.Text.Encoding.UTF8, "application/json")
        };

        var sut = CreateSut(response);
        var result = await sut.GeocodeAsync("NonExistentPlace12345");
        result.Should().BeNull();
    }

    [Fact]
    public async Task GeocodeAsync_HttpError_ReturnsNull()
    {
        var response = new HttpResponseMessage(HttpStatusCode.InternalServerError);
        var sut = CreateSut(response);
        var result = await sut.GeocodeAsync("Istanbul");
        result.Should().BeNull();
    }

    [Fact]
    public async Task GeocodeAsync_InvalidCoordinates_ReturnsNull()
    {
        var json = JsonSerializer.Serialize(new[]
        {
            new { lat = "not_a_number", lon = "also_not", display_name = "Bad Data", address = (object?)null }
        });
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };

        var sut = CreateSut(response);
        var result = await sut.GeocodeAsync("SomePlace");
        result.Should().BeNull();
    }

    [Fact]
    public async Task GeocodeAsync_TurkeyCoordinatesInRange()
    {
        var json = JsonSerializer.Serialize(new[]
        {
            new { lat = "38.4192", lon = "27.1287", display_name = "Izmir, Turkey", address = new { province = "Izmir" } }
        });
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };

        var sut = CreateSut(response);
        var result = await sut.GeocodeAsync("Izmir");

        result.Should().NotBeNull();
        result!.Latitude.Should().BeInRange(35.8, 42.1);
        result.Longitude.Should().BeInRange(25.5, 44.8);
    }

    #endregion

    #region SearchAsync Tests

    [Fact]
    public async Task SearchAsync_MultipleResults_ReturnsAll()
    {
        var json = JsonSerializer.Serialize(new[]
        {
            new { lat = "41.0082", lon = "28.9784", display_name = "Istanbul Center", address = (object?)null },
            new { lat = "41.0500", lon = "29.0100", display_name = "Istanbul Kadikoy", address = (object?)null }
        });
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };

        var sut = CreateSut(response);
        var results = await sut.SearchAsync("Istanbul", 5);

        results.Should().HaveCount(2);
    }

    [Fact]
    public async Task SearchAsync_EmptyQuery_ReturnsEmptyList()
    {
        var sut = CreateSut(new HttpResponseMessage(HttpStatusCode.OK));
        var results = await sut.SearchAsync("");
        results.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchAsync_HttpError_ReturnsEmptyList()
    {
        var sut = CreateSut(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        var results = await sut.SearchAsync("Istanbul");
        results.Should().BeEmpty();
    }

    #endregion

    #region ReverseGeocodeAsync Tests

    [Fact]
    public async Task ReverseGeocodeAsync_ValidCoordinates_ReturnsStructuredResult()
    {
        var json = JsonSerializer.Serialize(new
        {
            lat = "41.0082",
            lon = "28.9784",
            display_name = "Sultanahmet, Fatih, Istanbul, Turkey",
            address = new
            {
                road = "Divanyolu Caddesi",
                house_number = "42",
                suburb = "Sultanahmet",
                district = "Fatih",
                province = "Istanbul",
                country = "Turkey"
            }
        });
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };

        var sut = CreateSut(response);
        var result = await sut.ReverseGeocodeAsync(41.0082, 28.9784);

        result.Should().NotBeNull();
        result!.City.Should().Be("Istanbul");
        result.District.Should().Be("Fatih");
        result.Address.Should().Contain("Divanyolu Caddesi");
        result.Address.Should().Contain("No:42");
        result.DisplayName.Should().Contain("Istanbul");
    }

    [Fact]
    public async Task ReverseGeocodeAsync_HttpError_ReturnsNull()
    {
        var response = new HttpResponseMessage(HttpStatusCode.ServiceUnavailable);
        var sut = CreateSut(response);
        var result = await sut.ReverseGeocodeAsync(41.0082, 28.9784);
        result.Should().BeNull();
    }

    [Fact]
    public async Task ReverseGeocodeAsync_NullResult_ReturnsNull()
    {
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("null", System.Text.Encoding.UTF8, "application/json")
        };

        var sut = CreateSut(response);
        var result = await sut.ReverseGeocodeAsync(0, 0);
        result.Should().BeNull();
    }

    [Fact]
    public async Task ReverseGeocodeAsync_NoRoad_AddressIsNull()
    {
        var json = JsonSerializer.Serialize(new
        {
            lat = "39.9334",
            lon = "32.8597",
            display_name = "Ankara, Turkey",
            address = new
            {
                province = "Ankara",
                district = "Cankaya",
                country = "Turkey"
            }
        });
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };

        var sut = CreateSut(response);
        var result = await sut.ReverseGeocodeAsync(39.9334, 32.8597);

        result.Should().NotBeNull();
        result!.Address.Should().BeNull();
        result.City.Should().Be("Ankara");
    }

    #endregion

    private class FakeHttpMessageHandler(HttpResponseMessage response) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(response);
        }
    }
}
