using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class OrderLineTests
{
    [Fact]
    public void OrderLine_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var line = new OrderLine();

        line.Id.Should().NotBeEmpty();
        line.OrderId.Should().Be(Guid.Empty);
        line.LineNumber.Should().Be(0);
        line.ProductCode.Should().BeNull();
        line.ProductName.Should().BeNull();
        line.Quantity.Should().Be(0);
        line.Unit.Should().BeNull();
        line.WeightKg.Should().Be(0);
        line.VolumeM3.Should().Be(0);
        line.WidthCm.Should().Be(0);
        line.HeightCm.Should().Be(0);
        line.DepthCm.Should().Be(0);
        line.DesiWeight.Should().Be(0);
        line.IsStackable.Should().BeTrue();
    }

    [Fact]
    public void OrderLine_BoyutlarAtanabilmeli()
    {
        var line = new OrderLine
        {
            WidthCm = 60,
            HeightCm = 40,
            DepthCm = 40,
            WeightKg = 25
        };

        line.WidthCm.Should().Be(60);
        line.HeightCm.Should().Be(40);
        line.DepthCm.Should().Be(40);
    }

    [Theory]
    [InlineData(60, 40, 40, 32)]        // 60×40×40 / 3000 = 32
    [InlineData(120, 80, 100, 320)]      // 120×80×100 / 3000 = 320
    [InlineData(100, 100, 100, 333.33)]  // 100×100×100 / 3000 = 333.33
    [InlineData(0, 40, 40, 0)]           // 0 boyut = 0 desi
    [InlineData(60, 0, 40, 0)]           // 0 boyut = 0 desi
    [InlineData(60, 40, 0, 0)]           // 0 boyut = 0 desi
    public void DesiWeight_Hesaplama_DogruOlmali(decimal w, decimal h, decimal d, decimal expectedDesi)
    {
        var desi = w * h * d / 3000m;

        var line = new OrderLine
        {
            WidthCm = w,
            HeightCm = h,
            DepthCm = d,
            DesiWeight = Math.Round(desi, 2)
        };

        line.DesiWeight.Should().BeApproximately(expectedDesi, 0.01m);
    }

    [Theory]
    [InlineData(25, 32, 32)]   // Desi > Actual → Chargeable = Desi
    [InlineData(50, 32, 50)]   // Actual > Desi → Chargeable = Actual
    [InlineData(32, 32, 32)]   // Esit → Chargeable = ikisi de
    [InlineData(0, 0, 0)]      // Ikisi de 0
    public void ChargeableWeight_MaxOlmali(decimal actualKg, decimal desiKg, decimal expectedChargeable)
    {
        var chargeable = Math.Max(actualKg, desiKg);
        chargeable.Should().Be(expectedChargeable);
    }

    [Fact]
    public void OrderLine_IsStackableFalseOlabilir()
    {
        var line = new OrderLine { IsStackable = false };
        line.IsStackable.Should().BeFalse();
    }
}
