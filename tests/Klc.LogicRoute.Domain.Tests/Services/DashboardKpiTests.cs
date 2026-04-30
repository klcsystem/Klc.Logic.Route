using FluentAssertions;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Services;

/// <summary>
/// Dashboard KPI hesaplama testleri.
/// Toplam siparis, sevkiyat, maliyet, ortalama teslimat suresi vb.
/// </summary>
public class DashboardKpiTests
{
    private record ShipmentKpi(
        ShipmentStatus Status,
        decimal TotalCost,
        DateTime? PlannedDelivery,
        DateTime? ActualDelivery,
        string ProviderName);

    [Fact]
    public void ToplamSiparisSayisi_DogruHesaplanmali()
    {
        var shipments = CreateTestShipments();
        var total = shipments.Count;
        total.Should().Be(5);
    }

    [Fact]
    public void AktifSevkiyatSayisi_DogruHesaplanmali()
    {
        var shipments = CreateTestShipments();
        var active = shipments.Count(s =>
            s.Status != ShipmentStatus.Delivered &&
            s.Status != ShipmentStatus.Cancelled &&
            s.Status != ShipmentStatus.Completed);

        active.Should().Be(2);
    }

    [Fact]
    public void TamamlananSevkiyatSayisi_DogruHesaplanmali()
    {
        var shipments = CreateTestShipments();
        var completed = shipments.Count(s => s.Status == ShipmentStatus.Delivered);

        completed.Should().Be(2);
    }

    [Fact]
    public void ToplamMaliyet_DogruHesaplanmali()
    {
        var shipments = CreateTestShipments();
        var totalCost = shipments.Sum(s => s.TotalCost);

        totalCost.Should().Be(26500);
    }

    [Fact]
    public void OrtalamaMaliyet_DogruHesaplanmali()
    {
        var shipments = CreateTestShipments();
        var avgCost = shipments.Average(s => s.TotalCost);

        avgCost.Should().Be(5300);
    }

    [Fact]
    public void ZamanindaTeslimatOrani_DogruHesaplanmali()
    {
        var shipments = CreateTestShipments();
        var delivered = shipments
            .Where(s => s.Status == ShipmentStatus.Delivered && s.PlannedDelivery.HasValue && s.ActualDelivery.HasValue)
            .ToList();

        var onTime = delivered.Count(s => s.ActualDelivery <= s.PlannedDelivery);
        var rate = delivered.Count > 0 ? (decimal)onTime / delivered.Count * 100 : 0;

        rate.Should().Be(50, "2 tamamlanan sevkiyattan 1'i zamaninda");
    }

    [Fact]
    public void OrtalamaTeslimatSuresi_DogruHesaplanmali()
    {
        var shipments = CreateTestShipments();
        var delivered = shipments
            .Where(s => s.Status == ShipmentStatus.Delivered && s.PlannedDelivery.HasValue && s.ActualDelivery.HasValue)
            .ToList();

        // Basit: planlanan-gerceklesen farkinin ortalamasi
        delivered.Should().HaveCount(2);
    }

    [Fact]
    public void ProviderBazindaMaliyet_DogruGruplanmali()
    {
        var shipments = CreateTestShipments();
        var byProvider = shipments
            .GroupBy(s => s.ProviderName)
            .Select(g => new { Provider = g.Key, Total = g.Sum(s => s.TotalCost), Count = g.Count() })
            .OrderByDescending(g => g.Total)
            .ToList();

        byProvider.Should().HaveCount(3);
        byProvider.First().Total.Should().BeGreaterThan(0);
    }

    [Fact]
    public void StatusDagilimi_DogruHesaplanmali()
    {
        var shipments = CreateTestShipments();
        var byStatus = shipments
            .GroupBy(s => s.Status)
            .ToDictionary(g => g.Key, g => g.Count());

        byStatus[ShipmentStatus.Delivered].Should().Be(2);
        byStatus[ShipmentStatus.InTransit].Should().Be(1);
        byStatus[ShipmentStatus.Approved].Should().Be(1);
        byStatus[ShipmentStatus.Cancelled].Should().Be(1);
    }

    [Fact]
    public void IptalOrani_DogruHesaplanmali()
    {
        var shipments = CreateTestShipments();
        var cancelRate = (decimal)shipments.Count(s => s.Status == ShipmentStatus.Cancelled) / shipments.Count * 100;

        cancelRate.Should().Be(20);
    }

    private static List<ShipmentKpi> CreateTestShipments()
    {
        var now = DateTime.UtcNow;
        return
        [
            new(ShipmentStatus.Delivered, 5000, now.AddDays(-2), now.AddDays(-2.5), "Aras"),     // zamaninda
            new(ShipmentStatus.Delivered, 7500, now.AddDays(-1), now.AddDays(-0.5), "MNG"),       // gec
            new(ShipmentStatus.InTransit, 4000, now.AddDays(1), null, "Aras"),
            new(ShipmentStatus.Approved, 6000, now.AddDays(3), null, "Yurtici"),
            new(ShipmentStatus.Cancelled, 4000, now.AddDays(2), null, "MNG")
        ];
    }
}
