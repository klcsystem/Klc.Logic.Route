using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class ShipmentTests
{
    [Fact]
    public void Shipment_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var shipment = new Shipment();

        shipment.Id.Should().NotBeEmpty();
        shipment.ShipmentNumber.Should().BeEmpty();
        shipment.Status.Should().Be(ShipmentStatus.Draft);
        shipment.Priority.Should().Be(ShipmentPriority.Normal);
        shipment.TotalWeightKg.Should().Be(0);
        shipment.TotalVolumeM3.Should().Be(0);
        shipment.ChargeableWeight.Should().Be(0);
        shipment.TotalDesiWeight.Should().Be(0);
        shipment.PalletCount.Should().Be(0);
        shipment.IsHazardous.Should().BeFalse();
        shipment.RequiresColdChain.Should().BeFalse();
        shipment.IsStackable.Should().BeTrue();
        shipment.Currency.Should().Be("TRY");
        shipment.Items.Should().BeEmpty();
    }

    [Theory]
    [InlineData(ShipmentStatus.Draft)]
    [InlineData(ShipmentStatus.Calculated)]
    [InlineData(ShipmentStatus.PendingApproval)]
    [InlineData(ShipmentStatus.Approved)]
    [InlineData(ShipmentStatus.SentToProvider)]
    [InlineData(ShipmentStatus.VehicleAssigned)]
    [InlineData(ShipmentStatus.Loading)]
    [InlineData(ShipmentStatus.InTransit)]
    [InlineData(ShipmentStatus.Delivered)]
    [InlineData(ShipmentStatus.Completed)]
    [InlineData(ShipmentStatus.Cancelled)]
    public void Shipment_TumStatusDegerleriAtanabilmeli(ShipmentStatus status)
    {
        var shipment = new Shipment { Status = status };
        shipment.Status.Should().Be(status);
    }

    [Fact]
    public void Shipment_ShipmentItemEklenebilmeli()
    {
        var shipment = new Shipment { ShipmentNumber = "SHP-001" };
        var item = new ShipmentItem
        {
            ShipmentId = shipment.Id,
            ProductCode = "PRD-001",
            ProductName = "Test Urun",
            WeightKg = 500,
            VolumeM3 = 2.5m,
            Quantity = 10
        };

        shipment.Items.Add(item);

        shipment.Items.Should().HaveCount(1);
        shipment.Items.First().ProductCode.Should().Be("PRD-001");
    }

    [Fact]
    public void Shipment_SurucuVeAracBilgisiAtanabilmeli()
    {
        var shipment = new Shipment
        {
            DriverName = "Mehmet Yilmaz",
            DriverPhone = "+905551234567",
            VehiclePlate = "34 KLC 123"
        };

        shipment.DriverName.Should().Be("Mehmet Yilmaz");
        shipment.VehiclePlate.Should().Be("34 KLC 123");
    }

    [Fact]
    public void Shipment_TarihlerAtanabilmeli()
    {
        var requested = DateTime.UtcNow;
        var actual = DateTime.UtcNow.AddHours(2);

        var shipment = new Shipment
        {
            RequestedPickupDate = requested,
            ActualPickupDate = actual,
            RequestedDeliveryDate = requested.AddDays(1),
            ActualDeliveryDate = actual.AddDays(1)
        };

        shipment.RequestedPickupDate.Should().Be(requested);
        shipment.ActualPickupDate.Should().Be(actual);
    }

    [Theory]
    [InlineData(VehicleCategory.Tir)]
    [InlineData(VehicleCategory.Kamyon)]
    [InlineData(VehicleCategory.Frigorifik)]
    public void Shipment_AracKategorisiAtanabilmeli(VehicleCategory category)
    {
        var shipment = new Shipment { RecommendedVehicle = category };
        shipment.RecommendedVehicle.Should().Be(category);
    }

    [Fact]
    public void Shipment_KararMotoruSonuclariAtanabilmeli()
    {
        var providerId = Guid.NewGuid();
        var rateId = Guid.NewGuid();

        var shipment = new Shipment
        {
            SelectedProviderId = providerId,
            SelectedContractRateId = rateId,
            RecommendedVehicle = VehicleCategory.Tir,
            CalculatedPrice = 15000,
            ProviderReferenceId = "ARAS-REF-001"
        };

        shipment.SelectedProviderId.Should().Be(providerId);
        shipment.CalculatedPrice.Should().Be(15000);
    }

    [Fact]
    public void Shipment_CanlıTakipBilgisiAtanabilmeli()
    {
        var shipment = new Shipment
        {
            CurrentLatitude = 41.0082m,
            CurrentLongitude = 28.9784m,
            LastTrackingUpdate = DateTime.UtcNow,
            EstimatedArrival = "2 saat 15 dakika"
        };

        shipment.CurrentLatitude.Should().Be(41.0082m);
        shipment.LastTrackingUpdate.Should().NotBeNull();
    }

    [Theory]
    [InlineData(ShipmentPriority.Normal)]
    [InlineData(ShipmentPriority.Priority)]
    [InlineData(ShipmentPriority.Urgent)]
    public void Shipment_TumPriorityDegerleriAtanabilmeli(ShipmentPriority priority)
    {
        var shipment = new Shipment { Priority = priority };
        shipment.Priority.Should().Be(priority);
    }
}
