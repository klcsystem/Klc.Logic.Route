using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class WebhookEventTests
{
    [Fact]
    public void WebhookEvent_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var evt = new WebhookEvent();

        evt.Id.Should().NotBeEmpty();
        evt.ProviderCode.Should().BeEmpty();
        evt.EventType.Should().BeEmpty();
        evt.TrackingNumber.Should().BeNull();
        evt.Payload.Should().BeNull();
        evt.Status.Should().Be("Received");
        evt.ProcessingNotes.Should().BeNull();
        evt.ProcessedAt.Should().BeNull();
    }

    [Fact]
    public void WebhookEvent_TumAlanlarAtanabilmeli()
    {
        var evt = new WebhookEvent
        {
            ProviderCode = "ARAS",
            EventType = "StatusUpdate",
            TrackingNumber = "TRK-2026-001",
            Payload = "{\"status\": \"delivered\", \"timestamp\": \"2026-04-29T10:00:00Z\"}",
            Status = "Processed",
            ProcessingNotes = "Siparis durumu guncellendi",
            ProcessedAt = DateTime.UtcNow
        };

        evt.ProviderCode.Should().Be("ARAS");
        evt.EventType.Should().Be("StatusUpdate");
        evt.TrackingNumber.Should().Be("TRK-2026-001");
        evt.Status.Should().Be("Processed");
        evt.ProcessedAt.Should().NotBeNull();
    }

    [Theory]
    [InlineData("Received")]
    [InlineData("Processing")]
    [InlineData("Processed")]
    [InlineData("Failed")]
    public void WebhookEvent_TumStatusDegerleriAtanabilmeli(string status)
    {
        var evt = new WebhookEvent { Status = status };
        evt.Status.Should().Be(status);
    }

    [Fact]
    public void WebhookEvent_PayloadJsonOlabilir()
    {
        var evt = new WebhookEvent
        {
            Payload = "{\"shipmentId\": \"abc-123\", \"newStatus\": \"InTransit\"}"
        };

        evt.Payload.Should().Contain("shipmentId");
        evt.Payload.Should().Contain("InTransit");
    }
}
