using System.Reflection;
using FluentAssertions;
using Klc.LogicRoute.Infrastructure.Persistence;

namespace Klc.LogicRoute.Application.Tests.SeedData;

/// <summary>
/// Seed data'nin dogru yuklendigini dogrulamak icin statik veri validasyon testleri.
/// Sehir koordinatlari, provider bilgileri, mesafe hesaplamalari.
/// </summary>
public class SeedDataValidationTests
{
    // Turkey's bounding box (approximate)
    private const double TurkeyMinLat = 35.8;
    private const double TurkeyMaxLat = 42.1;
    private const double TurkeyMinLng = 25.5;
    private const double TurkeyMaxLng = 44.8;

    // Known city coordinates for spot-check validation
    private static readonly Dictionary<string, (double Lat, double Lng)> KnownCityCoordinates = new()
    {
        ["Istanbul"] = (41.0082, 28.9784),
        ["Ankara"] = (39.9334, 32.8597),
        ["Izmir"] = (38.4192, 27.1287),
        ["Antalya"] = (36.8969, 30.7133),
        ["Trabzon"] = (41.0015, 39.7178),
        ["Erzurum"] = (39.9055, 41.2658),
        ["Edirne"] = (41.6818, 26.5623),
    };

    private static (string City, double Lat, double Lng)[] GetTurkishCities()
    {
        var field = typeof(SeedDataGenerator)
            .GetField("TurkishCities", BindingFlags.NonPublic | BindingFlags.Static);
        return ((string City, double Lat, double Lng)[])field!.GetValue(null)!;
    }

    private static Array GetProviders()
    {
        var field = typeof(SeedDataGenerator)
            .GetField("Providers", BindingFlags.NonPublic | BindingFlags.Static);
        return (Array)field!.GetValue(null)!;
    }

    [Fact]
    public void TurkishCities_ShouldHaveAtLeast50Cities()
    {
        var cities = GetTurkishCities();
        cities.Should().HaveCountGreaterOrEqualTo(50);
    }

    [Fact]
    public void TurkishCities_AllCitiesShouldHaveUniqueNames()
    {
        var cities = GetTurkishCities();
        var names = cities.Select(c => c.City).ToList();
        names.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void TurkishCities_AllCoordinatesShouldBeWithinTurkey()
    {
        var cities = GetTurkishCities();

        foreach (var (city, lat, lng) in cities)
        {
            lat.Should().BeInRange(TurkeyMinLat, TurkeyMaxLat,
                $"{city} latitude {lat} should be within Turkey bounds");
            lng.Should().BeInRange(TurkeyMinLng, TurkeyMaxLng,
                $"{city} longitude {lng} should be within Turkey bounds");
        }
    }

    [Theory]
    [InlineData("Istanbul", 41.0082, 28.9784)]
    [InlineData("Ankara", 39.9334, 32.8597)]
    [InlineData("Izmir", 38.4192, 27.1287)]
    [InlineData("Antalya", 36.8969, 30.7133)]
    [InlineData("Trabzon", 41.0015, 39.7178)]
    public void TurkishCities_KnownCitiesShouldHaveCorrectCoordinates(
        string cityName, double expectedLat, double expectedLng)
    {
        var cities = GetTurkishCities();
        var city = cities.FirstOrDefault(c => c.City == cityName);

        city.Should().NotBe(default, $"City {cityName} should exist in seed data");
        city.Lat.Should().BeApproximately(expectedLat, 0.01);
        city.Lng.Should().BeApproximately(expectedLng, 0.01);
    }

    [Fact]
    public void TurkishCities_NoZeroCoordinates()
    {
        var cities = GetTurkishCities();

        foreach (var (city, lat, lng) in cities)
        {
            lat.Should().NotBe(0, $"{city} latitude should not be 0");
            lng.Should().NotBe(0, $"{city} longitude should not be 0");
        }
    }

    [Fact]
    public void Providers_ShouldHaveAtLeast10Providers()
    {
        var providers = GetProviders();
        providers.Length.Should().BeGreaterThanOrEqualTo(10);
    }

    [Fact]
    public void EstimateDistance_IstanbulAnkara_ShouldBeRealistic()
    {
        // Istanbul-Ankara road distance ~450km. Haversine * 1.3 should be in ballpark.
        var distance = InvokeEstimateDistance("Istanbul", "Ankara");

        // Real road: ~450km. Haversine straight line ~350km * 1.3 = ~455km
        distance.Should().BeInRange(400m, 550m,
            "Istanbul-Ankara distance should be realistic (400-550km)");
    }

    [Fact]
    public void EstimateDistance_IstanbulIzmir_ShouldBeRealistic()
    {
        var distance = InvokeEstimateDistance("Istanbul", "Izmir");

        // Real road: ~480km. Haversine * 1.3 should be close
        distance.Should().BeInRange(350m, 600m,
            "Istanbul-Izmir distance should be realistic");
    }

    [Fact]
    public void EstimateDistance_ShortRoute_AdanaMersin_ShouldBeRealistic()
    {
        var distance = InvokeEstimateDistance("Adana", "Mersin");

        // Real road: ~70km
        distance.Should().BeInRange(50m, 120m,
            "Adana-Mersin short distance should be realistic");
    }

    [Fact]
    public void EstimateDistance_LongRoute_IstanbulVan_ShouldBeRealistic()
    {
        var distance = InvokeEstimateDistance("Istanbul", "Van");

        // Real road: ~1700km
        distance.Should().BeInRange(1300m, 2000m,
            "Istanbul-Van long distance should be realistic");
    }

    [Fact]
    public void EstimateDistance_SameCity_ShouldBeZero()
    {
        var distance = InvokeEstimateDistance("Istanbul", "Istanbul");
        distance.Should().Be(0m);
    }

    [Fact]
    public void EstimateDistance_UnknownCity_ShouldReturnDefault500()
    {
        var distance = InvokeEstimateDistance("BilinmeyenSehir", "Ankara");
        distance.Should().Be(500m);
    }

    [Fact]
    public void EstimateDistance_IsSymmetric()
    {
        var distAB = InvokeEstimateDistance("Istanbul", "Ankara");
        var distBA = InvokeEstimateDistance("Ankara", "Istanbul");
        distAB.Should().Be(distBA);
    }

    [Fact]
    public void EstimateDistance_TriangleInequality()
    {
        var ab = InvokeEstimateDistance("Istanbul", "Ankara");
        var bc = InvokeEstimateDistance("Ankara", "Izmir");
        var ac = InvokeEstimateDistance("Istanbul", "Izmir");

        // Triangle inequality: any side <= sum of other two
        ac.Should().BeLessThanOrEqualTo(ab + bc + 1); // +1 for rounding
    }

    [Fact]
    public void TurkishCities_ShouldCoverAllMajorRegions()
    {
        var cities = GetTurkishCities();
        var cityNames = cities.Select(c => c.City).ToHashSet();

        // Major regional centers that should be present
        string[] majorCities = ["Istanbul", "Ankara", "Izmir", "Antalya", "Bursa",
            "Adana", "Trabzon", "Erzurum", "Diyarbakir", "Gaziantep",
            "Konya", "Samsun", "Mersin", "Kayseri"];

        foreach (var city in majorCities)
        {
            cityNames.Should().Contain(city, $"Major city {city} should be in seed data");
        }
    }

    private static decimal InvokeEstimateDistance(string origin, string destination)
    {
        var method = typeof(SeedDataGenerator)
            .GetMethod("EstimateDistance", BindingFlags.NonPublic | BindingFlags.Static);
        return (decimal)method!.Invoke(null, [origin, destination])!;
    }
}
