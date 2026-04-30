using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class OrderTests
{
    [Fact]
    public void Order_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var order = new Order();

        order.Id.Should().NotBeEmpty();
        order.OrderNumber.Should().BeEmpty();
        order.Status.Should().Be(OrderStatus.Draft);
        order.Priority.Should().Be(OrderPriority.Normal);
        order.TotalWeightKg.Should().Be(0);
        order.TotalVolumeM3.Should().Be(0);
        order.PalletCount.Should().Be(0);
        order.IsHazardous.Should().BeFalse();
        order.RequiresColdChain.Should().BeFalse();
        order.Currency.Should().Be("TRY");
        order.Lines.Should().BeEmpty();
        order.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public void Order_AdresAtanabilmeli()
    {
        var order = new Order
        {
            CustomerName = "Klc Lojistik",
            OriginAddress = "Istanbul Merkez",
            OriginCity = "Istanbul",
            OriginLat = 41.0082,
            OriginLng = 28.9784,
            DestinationAddress = "Ankara Depo",
            DestinationCity = "Ankara",
            DestinationLat = 39.9334,
            DestinationLng = 32.8597
        };

        order.OriginCity.Should().Be("Istanbul");
        order.DestinationCity.Should().Be("Ankara");
        order.OriginLat.Should().BeApproximately(41.0082, 0.001);
        order.DestinationLng.Should().BeApproximately(32.8597, 0.001);
    }

    [Theory]
    [InlineData(OrderStatus.Draft)]
    [InlineData(OrderStatus.Pending)]
    [InlineData(OrderStatus.ReadyForShipment)]
    [InlineData(OrderStatus.InShipment)]
    [InlineData(OrderStatus.Completed)]
    [InlineData(OrderStatus.Cancelled)]
    public void Order_TumStatusDegerleriAtanabilmeli(OrderStatus status)
    {
        var order = new Order { Status = status };
        order.Status.Should().Be(status);
    }

    [Theory]
    [InlineData(OrderPriority.Normal)]
    [InlineData(OrderPriority.Priority)]
    [InlineData(OrderPriority.Urgent)]
    public void Order_TumPriorityDegerleriAtanabilmeli(OrderPriority priority)
    {
        var order = new Order { Priority = priority };
        order.Priority.Should().Be(priority);
    }

    [Fact]
    public void Order_OrderLineEklenebilmeli()
    {
        var order = new Order { OrderNumber = "ORD-001" };
        var line = new OrderLine
        {
            OrderId = order.Id,
            LineNumber = 1,
            ProductCode = "PRD-001",
            Quantity = 10,
            WeightKg = 500,
            VolumeM3 = 2.5m
        };

        order.Lines.Add(line);

        order.Lines.Should().HaveCount(1);
        order.Lines.First().ProductCode.Should().Be("PRD-001");
    }

    [Fact]
    public void Order_TehlikeliMaddeIsaretlenebilmeli()
    {
        var order = new Order
        {
            IsHazardous = true,
            ProductCategory = "Kimyasal"
        };

        order.IsHazardous.Should().BeTrue();
    }

    [Fact]
    public void Order_SogukZincirIsaretlenebilmeli()
    {
        var order = new Order
        {
            RequiresColdChain = true,
            TemperatureMin = -18,
            TemperatureMax = -12
        };

        order.RequiresColdChain.Should().BeTrue();
        order.TemperatureMin.Should().Be(-18);
        order.TemperatureMax.Should().Be(-12);
    }

    [Fact]
    public void Order_ErpReferansiAtanabilmeli()
    {
        var erpId = Guid.NewGuid();
        var order = new Order
        {
            ErpReferenceId = "SAP-4500001234",
            ErpConnectionId = erpId
        };

        order.ErpReferenceId.Should().Be("SAP-4500001234");
        order.ErpConnectionId.Should().Be(erpId);
    }

    [Fact]
    public void Order_BaseEntityOzellikleriMirasAlmali()
    {
        var order = new Order();

        order.TenantId.Should().Be(Guid.Empty);
        order.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
    }
}
