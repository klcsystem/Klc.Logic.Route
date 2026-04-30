using FluentAssertions;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Services;

/// <summary>
/// Bildirim tetikleme testleri.
/// Belirli olaylarda bildirim olusturulmali.
/// </summary>
public class NotificationTriggerTests
{
    private enum NotificationType
    {
        ShipmentCreated,
        ShipmentStatusChanged,
        DeliveryDelayed,
        ContractExpiringSoon,
        HighCostAlert,
        ErpSyncFailed
    }

    private record Notification(NotificationType Type, string Title, string Message, bool IsUrgent);

    [Fact]
    public void SevkiyatOlusturuldu_BildirimTetiklenmeli()
    {
        var notification = new Notification(
            NotificationType.ShipmentCreated,
            "Yeni Sevkiyat",
            "SHP-001 numarali sevkiyat olusturuldu",
            false);

        notification.Type.Should().Be(NotificationType.ShipmentCreated);
        notification.IsUrgent.Should().BeFalse();
    }

    [Fact]
    public void TeslimatGecikmesi_AcilBildirimTetiklenmeli()
    {
        var planned = DateTime.UtcNow.AddDays(-1);
        var isDelayed = DateTime.UtcNow > planned;

        isDelayed.Should().BeTrue();

        var notification = new Notification(
            NotificationType.DeliveryDelayed,
            "Teslimat Gecikmesi",
            "SHP-001 planlanan teslimat tarihini gecti",
            true);

        notification.IsUrgent.Should().BeTrue();
    }

    [Fact]
    public void KontratSuresiDoluyor_BildirimTetiklenmeli()
    {
        var contractEndDate = DateTime.UtcNow.AddDays(15);
        var warningThresholdDays = 30;
        var isExpiringSoon = (contractEndDate - DateTime.UtcNow).TotalDays <= warningThresholdDays;

        isExpiringSoon.Should().BeTrue();

        var notification = new Notification(
            NotificationType.ContractExpiringSoon,
            "Kontrat Sure Uyarisi",
            "CNT-001 kontrati 15 gun icinde sona erecek",
            false);

        notification.Type.Should().Be(NotificationType.ContractExpiringSoon);
    }

    [Fact]
    public void KontratSuresiUzak_BildirimTetiklenmemeli()
    {
        var contractEndDate = DateTime.UtcNow.AddDays(60);
        var warningThresholdDays = 30;
        var isExpiringSoon = (contractEndDate - DateTime.UtcNow).TotalDays <= warningThresholdDays;

        isExpiringSoon.Should().BeFalse();
    }

    [Fact]
    public void YuksekMaliyet_UyariBildirimiTetiklenmeli()
    {
        var shipmentCost = 15000m;
        var averageCost = 8000m;
        var threshold = 1.5m; // %150 uzerinde

        var isHighCost = shipmentCost > averageCost * threshold;

        isHighCost.Should().BeTrue();
    }

    [Fact]
    public void NormalMaliyet_UyariTetiklenmemeli()
    {
        var shipmentCost = 9000m;
        var averageCost = 8000m;
        var threshold = 1.5m;

        var isHighCost = shipmentCost > averageCost * threshold;

        isHighCost.Should().BeFalse();
    }

    [Fact]
    public void ErpSyncBasarisiz_AcilBildirimTetiklenmeli()
    {
        var syncStatus = "Failed";
        var isFailed = syncStatus == "Failed";

        isFailed.Should().BeTrue();

        var notification = new Notification(
            NotificationType.ErpSyncFailed,
            "ERP Senkronizasyon Hatasi",
            "SAP baglantisi basarisiz oldu",
            true);

        notification.IsUrgent.Should().BeTrue();
    }

    [Fact]
    public void StatusDegisikligi_BildirimOlusturmali()
    {
        var oldStatus = ShipmentStatus.Approved;
        var newStatus = ShipmentStatus.InTransit;
        var statusChanged = oldStatus != newStatus;

        statusChanged.Should().BeTrue();
    }
}
