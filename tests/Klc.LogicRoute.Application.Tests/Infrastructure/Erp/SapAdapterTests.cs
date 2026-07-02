using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Infrastructure.ExternalServices.Erp;

namespace Klc.LogicRoute.Application.Tests.Infrastructure.Erp;

public class SapAdapterTests
{
    private readonly ILogger<SapAdapter> _logger = Substitute.For<ILogger<SapAdapter>>();

    private SapAdapter CreateAdapter(HttpMessageHandler handler)
    {
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://sap.test.com") };
        var factory = Substitute.For<IHttpClientFactory>();
        factory.CreateClient("SapOData").Returns(client);
        return new SapAdapter(_logger, factory);
    }

    private static ErpConnection CreateSapConnection()
    {
        return new ErpConnection
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            Name = "SAP Production",
            ErpType = ErpType.SapS4Hana,
            EndpointUrl = "https://sap.test.com",
            Username = "rfc_user",
            Password = "password",
            IsActive = true
        };
    }

    [Fact]
    public void SupportedType_SapS4HanaOlmali()
    {
        var adapter = CreateAdapter(new FakeHandler(HttpStatusCode.OK, "{}"));
        adapter.SupportedType.Should().Be(ErpType.SapS4Hana);
    }

    [Fact]
    public async Task TestConnectionAsync_BasariliResponse_TrueDoner()
    {
        var handler = new FakeHandler(HttpStatusCode.OK, "{\"d\":{\"results\":[]}}");
        var adapter = CreateAdapter(handler);

        var result = await adapter.TestConnectionAsync(CreateSapConnection());

        result.Should().BeTrue();
    }

    [Fact]
    public async Task TestConnectionAsync_BasarisizResponse_FalseDoner()
    {
        var handler = new FakeHandler(HttpStatusCode.Unauthorized, "");
        var adapter = CreateAdapter(handler);

        var result = await adapter.TestConnectionAsync(CreateSapConnection());

        result.Should().BeFalse();
    }

    [Fact]
    public async Task TestConnectionAsync_Exception_FalseDoner()
    {
        var handler = new FakeHandler(new HttpRequestException("Connection refused"));
        var adapter = CreateAdapter(handler);

        var result = await adapter.TestConnectionAsync(CreateSapConnection());

        result.Should().BeFalse();
    }

    [Fact]
    public async Task SyncOrdersAsync_BasariliDeliveryResponse_SiparisleriDoner()
    {
        var deliveryJson = JsonSerializer.Serialize(new
        {
            d = new
            {
                results = new[]
                {
                    new
                    {
                        OutboundDelivery = "80001234",
                        DeliveryDocumentType = "LF",
                        CreationDate = (string?)null,
                        SoldToParty = "CUST-001",
                        ShipToParty = "CUST-001",
                        ShippingPoint = "1000",
                        ActualDeliveryRoute = "R001",
                        ProposedDeliveryRoute = (string?)null,
                        HeaderGrossWeight = "1500.000",
                        HeaderNetWeight = "1400.000",
                        HeaderWeightUnit = "KG",
                        HeaderVolume = "5.500",
                        HeaderVolumeUnit = "M3",
                        PlannedGoodsIssueDate = (string?)null,
                        DeliveryDate = (string?)null,
                        DeliveryPriority = "01",
                        OverallSDProcessStatus = "A",
                        TotalNetAmount = "25000.00",
                        TransactionCurrency = "TRY",
                        ActualGoodsMovementDate = (string?)null,
                        DocumentDate = (string?)null,
                        SalesOrganization = "1000"
                    }
                }
            }
        });

        var handler = new FakeHandler(HttpStatusCode.OK, deliveryJson);
        var adapter = CreateAdapter(handler);
        var connection = CreateSapConnection();

        var orders = await adapter.SyncOrdersAsync(connection);

        orders.Should().HaveCount(1);
        orders[0].OrderNumber.Should().Be("DLV-80001234");
        orders[0].TenantId.Should().Be(connection.TenantId);
        orders[0].ErpConnectionId.Should().Be(connection.Id);
        orders[0].Priority.Should().Be(OrderPriority.Urgent);
        orders[0].Status.Should().Be(OrderStatus.Pending);
        orders[0].TotalWeightKg.Should().Be(1500m);
        orders[0].Currency.Should().Be("TRY");
    }

    [Fact]
    public async Task SyncOrdersAsync_BasarisizResponse_BosListeDoner()
    {
        var handler = new FakeHandler(HttpStatusCode.InternalServerError, "Error");
        var adapter = CreateAdapter(handler);

        var orders = await adapter.SyncOrdersAsync(CreateSapConnection());

        orders.Should().BeEmpty();
    }

    [Fact]
    public async Task SyncOrdersAsync_SinceParametresiKabulEdilmeli()
    {
        var handler = new FakeHandler(HttpStatusCode.OK, "{\"d\":{\"results\":[]}}");
        var adapter = CreateAdapter(handler);
        var since = DateTime.UtcNow.AddDays(-1);

        var orders = await adapter.SyncOrdersAsync(CreateSapConnection(), since);

        orders.Should().NotBeNull();
        orders.Should().BeEmpty();
    }

    /// <summary>
    /// Fake HTTP message handler for testing.
    /// </summary>
    private sealed class FakeHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _statusCode;
        private readonly string _content;
        private readonly Exception? _exception;

        public FakeHandler(HttpStatusCode statusCode, string content)
        {
            _statusCode = statusCode;
            _content = content;
        }

        public FakeHandler(Exception exception)
        {
            _statusCode = HttpStatusCode.OK;
            _content = "";
            _exception = exception;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (_exception != null)
                throw _exception;

            return Task.FromResult(new HttpResponseMessage(_statusCode)
            {
                Content = new StringContent(_content, System.Text.Encoding.UTF8, "application/json")
            });
        }
    }
}
