using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Infrastructure.ExternalServices.Erp;

namespace Klc.LogicRoute.Application.Tests.Infrastructure.Erp;

public class GenericErpAdapterTests
{
    private readonly GenericErpAdapter _adapter;

    public GenericErpAdapterTests()
    {
        var logger = Substitute.For<ILogger<GenericErpAdapter>>();
        _adapter = new GenericErpAdapter(logger);
    }

    [Fact]
    public void SupportedType_GenericOlmali()
    {
        _adapter.SupportedType.Should().Be(ErpType.Generic);
    }

    [Fact]
    public async Task TestConnectionAsync_EndpointUrlVarsa_TrueDoner()
    {
        var connection = new ErpConnection
        {
            EndpointUrl = "https://erp.klcsystem.com/api",
            IsActive = true
        };

        var result = await _adapter.TestConnectionAsync(connection);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task TestConnectionAsync_EndpointUrlBossa_FalseDoner()
    {
        var connection = new ErpConnection
        {
            EndpointUrl = null,
            IsActive = true
        };

        var result = await _adapter.TestConnectionAsync(connection);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task TestConnectionAsync_EndpointUrlBosString_FalseDoner()
    {
        var connection = new ErpConnection
        {
            EndpointUrl = "",
            IsActive = true
        };

        var result = await _adapter.TestConnectionAsync(connection);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task SyncOrdersAsync_BosListeDoner()
    {
        var connection = new ErpConnection
        {
            EndpointUrl = "https://erp.klcsystem.com/api"
        };

        var orders = await _adapter.SyncOrdersAsync(connection);

        orders.Should().NotBeNull();
        orders.Should().BeEmpty();
    }
}
