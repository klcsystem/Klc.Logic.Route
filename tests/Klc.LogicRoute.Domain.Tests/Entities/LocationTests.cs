using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class LocationTests
{
    [Fact]
    public void Location_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var location = new Location();

        location.Id.Should().NotBeEmpty();
        location.Name.Should().BeEmpty();
        location.Code.Should().BeNull();
        location.Address.Should().BeNull();
        location.City.Should().BeNull();
        location.District.Should().BeNull();
        location.Latitude.Should().BeNull();
        location.Longitude.Should().BeNull();
        location.IsActive.Should().BeTrue();
        location.Capacity.Should().BeNull();
        location.WorkingHours.Should().BeNull();
        location.ContactName.Should().BeNull();
        location.ContactPhone.Should().BeNull();
        location.IsDeleted.Should().BeFalse();
    }

    [Theory]
    [InlineData(LocationType.Depot)]
    [InlineData(LocationType.Warehouse)]
    [InlineData(LocationType.Hub)]
    [InlineData(LocationType.Customer)]
    [InlineData(LocationType.CrossDock)]
    [InlineData(LocationType.PickupPoint)]
    public void Location_TumLocationTypeDegerleriAtanabilmeli(LocationType type)
    {
        var location = new Location { LocationType = type };
        location.LocationType.Should().Be(type);
    }

    [Fact]
    public void Location_TumAlanlarAtanabilmeli()
    {
        var location = new Location
        {
            Name = "Istanbul Depo",
            Code = "IST-01",
            LocationType = LocationType.Depot,
            Address = "Tuzla Lojistik Bolgesi",
            City = "Istanbul",
            District = "Tuzla",
            Latitude = 40.8220,
            Longitude = 29.3006,
            IsActive = true,
            Capacity = 500,
            WorkingHours = "08:00-18:00",
            ContactName = "Ahmet Yilmaz",
            ContactPhone = "+905551234567"
        };

        location.Name.Should().Be("Istanbul Depo");
        location.Code.Should().Be("IST-01");
        location.LocationType.Should().Be(LocationType.Depot);
        location.City.Should().Be("Istanbul");
        location.District.Should().Be("Tuzla");
        location.Latitude.Should().BeApproximately(40.8220, 0.0001);
        location.Longitude.Should().BeApproximately(29.3006, 0.0001);
        location.Capacity.Should().Be(500);
        location.WorkingHours.Should().Be("08:00-18:00");
        location.ContactName.Should().Be("Ahmet Yilmaz");
        location.ContactPhone.Should().Be("+905551234567");
    }

    [Fact]
    public void Location_KoordinatlarNullOlabilir()
    {
        var location = new Location
        {
            Name = "Koordinatsiz Lokasyon",
            Latitude = null,
            Longitude = null
        };

        location.Latitude.Should().BeNull();
        location.Longitude.Should().BeNull();
    }

    [Fact]
    public void Location_BaseEntityOzellikleriMirasAlmali()
    {
        var location = new Location();

        location.TenantId.Should().Be(Guid.Empty);
        location.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
        location.CreatedBy.Should().BeNull();
        location.UpdatedAt.Should().BeNull();
        location.UpdatedBy.Should().BeNull();
    }

    [Fact]
    public void Location_DeaktifEdilediginde_IsActiveFalseOlmali()
    {
        var location = new Location { IsActive = true };
        location.IsActive = false;
        location.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Location_KapasiteAtanabilmeli()
    {
        var location = new Location { Capacity = 1000 };
        location.Capacity.Should().Be(1000);
    }
}
