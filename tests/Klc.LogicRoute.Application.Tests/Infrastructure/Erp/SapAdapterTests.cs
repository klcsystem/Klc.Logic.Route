using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Infrastructure.ExternalServices.Erp;

namespace Klc.LogicRoute.Application.Tests.Infrastructure.Erp;

public class SapAdapterTests
{
    private readonly SapAdapter _adapter;

    public SapAdapterTests()
    {
        var logger = Substitute.For<ILogger<SapAdapter>>();
        _adapter = new SapAdapter(logger);
    }

    private static ErpConnection CreateSapConnection()
    {
        return new ErpConnection
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            Name = "SAP Production",
            ErpType = ErpType.SapS4Hana,
            EndpointUrl = "https://sap.klcsystem.com/api",
            Username = "rfc_user",
            Password = "password",
            IsActive = true
        };
    }

    [Fact]
    public void SupportedType_SapS4HanaOlmali()
    {
        _adapter.SupportedType.Should().Be(ErpType.SapS4Hana);
    }

    [Fact]
    public async Task TestConnectionAsync_TrueDonerStub()
    {
        var connection = CreateSapConnection();
        var result = await _adapter.TestConnectionAsync(connection);
        result.Should().BeTrue();
    }

    [Fact]
    public async Task SyncOrdersAsync_DemoSiparislerDoner()
    {
        var connection = CreateSapConnection();

        var orders = await _adapter.SyncOrdersAsync(connection);

        orders.Should().HaveCount(2);
        orders.Should().AllSatisfy(o =>
        {
            o.Status.Should().Be(OrderStatus.Pending);
            o.TenantId.Should().Be(connection.TenantId);
            o.ErpConnectionId.Should().Be(connection.Id);
            o.OrderNumber.Should().StartWith("SAP-");
        });
    }

    [Fact]
    public async Task SyncOrdersAsync_SinceParametresiKabulEdilmeli()
    {
        var connection = CreateSapConnection();
        var since = DateTime.UtcNow.AddDays(-1);

        var orders = await _adapter.SyncOrdersAsync(connection, since);

        orders.Should().NotBeNull();
    }

    [Fact]
    public async Task SyncOrdersAsync_SiparislerFarkliSehirlerdenOlmali()
    {
        var connection = CreateSapConnection();

        var orders = await _adapter.SyncOrdersAsync(connection);

        var cities = orders.Select(o => o.OriginCity).Distinct();
        cities.Should().HaveCountGreaterOrEqualTo(2);
    }

    [Fact]
    public async Task SyncOrdersAsync_SogukZincirSiparisiIcerebilir()
    {
        var connection = CreateSapConnection();

        var orders = await _adapter.SyncOrdersAsync(connection);

        orders.Should().Contain(o => o.RequiresColdChain);
    }
}
