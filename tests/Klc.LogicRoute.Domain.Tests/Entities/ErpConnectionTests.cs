using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class ErpConnectionTests
{
    [Fact]
    public void ErpConnection_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var conn = new ErpConnection();

        conn.Id.Should().NotBeEmpty();
        conn.Name.Should().BeEmpty();
        conn.EndpointUrl.Should().BeNull();
        conn.Username.Should().BeNull();
        conn.Password.Should().BeNull();
        conn.IsActive.Should().BeTrue();
        conn.LastSyncAt.Should().BeNull();
        conn.LastSyncStatus.Should().BeNull();
        conn.Settings.Should().BeNull();
    }

    [Theory]
    [InlineData(ErpType.SapS4Hana)]
    [InlineData(ErpType.SapEcc)]
    [InlineData(ErpType.Oracle)]
    [InlineData(ErpType.MicrosoftDynamics)]
    [InlineData(ErpType.Logo)]
    [InlineData(ErpType.Netsis)]
    [InlineData(ErpType.Generic)]
    public void ErpConnection_TumErpTypeDegerleriAtanabilmeli(ErpType erpType)
    {
        var conn = new ErpConnection { ErpType = erpType };
        conn.ErpType.Should().Be(erpType);
    }

    [Fact]
    public void ErpConnection_BaglantiBilgileriAtanabilmeli()
    {
        var conn = new ErpConnection
        {
            Name = "SAP Production",
            ErpType = ErpType.SapS4Hana,
            EndpointUrl = "https://sap.klcsystem.com/api",
            Username = "rfc_user",
            Password = "encrypted_password",
            IsActive = true
        };

        conn.Name.Should().Be("SAP Production");
        conn.EndpointUrl.Should().Be("https://sap.klcsystem.com/api");
    }

    [Fact]
    public void ErpConnection_SyncDurumuGuncellenebilmeli()
    {
        var conn = new ErpConnection
        {
            LastSyncAt = DateTime.UtcNow,
            LastSyncStatus = "Basarili - 150 siparis cekildi"
        };

        conn.LastSyncAt.Should().NotBeNull();
        conn.LastSyncStatus.Should().Contain("Basarili");
    }

    [Fact]
    public void ErpConnection_SettingsJsonOlabilir()
    {
        var conn = new ErpConnection
        {
            Settings = "{\"timeout\": 30, \"retryCount\": 3}"
        };

        conn.Settings.Should().Contain("timeout");
    }
}
