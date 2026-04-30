using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class AuditLogTests
{
    [Fact]
    public void AuditLog_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var log = new AuditLog();

        log.Id.Should().NotBeEmpty();
        log.UserId.Should().BeNull();
        log.UserEmail.Should().BeNull();
        log.Action.Should().BeEmpty();
        log.EntityType.Should().BeEmpty();
        log.EntityId.Should().BeNull();
        log.OldValues.Should().BeNull();
        log.NewValues.Should().BeNull();
        log.IpAddress.Should().BeNull();
        log.UserAgent.Should().BeNull();
    }

    [Fact]
    public void AuditLog_CreateAksiyonuKaydedilebilmeli()
    {
        var log = new AuditLog
        {
            UserId = Guid.NewGuid().ToString(),
            UserEmail = "admin@klcsystem.com",
            Action = "Create",
            EntityType = "Order",
            EntityId = Guid.NewGuid(),
            NewValues = "{\"orderNumber\": \"ORD-001\", \"status\": \"Draft\"}",
            IpAddress = "192.168.1.100",
            UserAgent = "Mozilla/5.0"
        };

        log.Action.Should().Be("Create");
        log.EntityType.Should().Be("Order");
        log.OldValues.Should().BeNull();
        log.NewValues.Should().Contain("ORD-001");
    }

    [Fact]
    public void AuditLog_UpdateAksiyonuEskiVeYeniDegerleriKaydedebilmeli()
    {
        var log = new AuditLog
        {
            Action = "Update",
            EntityType = "Shipment",
            EntityId = Guid.NewGuid(),
            OldValues = "{\"status\": \"Planned\"}",
            NewValues = "{\"status\": \"InTransit\"}"
        };

        log.Action.Should().Be("Update");
        log.OldValues.Should().Contain("Planned");
        log.NewValues.Should().Contain("InTransit");
    }

    [Fact]
    public void AuditLog_DeleteAksiyonuKaydedilebilmeli()
    {
        var log = new AuditLog
        {
            Action = "Delete",
            EntityType = "Contract",
            EntityId = Guid.NewGuid(),
            OldValues = "{\"contractNumber\": \"CNT-001\"}"
        };

        log.Action.Should().Be("Delete");
        log.NewValues.Should().BeNull();
    }

    [Theory]
    [InlineData("Create")]
    [InlineData("Update")]
    [InlineData("Delete")]
    [InlineData("Login")]
    [InlineData("Logout")]
    public void AuditLog_TumAksiyonTipleriKaydedilebilmeli(string action)
    {
        var log = new AuditLog { Action = action };
        log.Action.Should().Be(action);
    }
}
