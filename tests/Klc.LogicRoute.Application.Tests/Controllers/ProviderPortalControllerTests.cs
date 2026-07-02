using FluentAssertions;
using Klc.LogicRoute.Api.Controllers;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;

namespace Klc.LogicRoute.Application.Tests.Controllers;

public class ProviderPortalControllerTests
{
    private readonly IProviderPortalRepository _portalRepo = Substitute.For<IProviderPortalRepository>();
    private readonly ITenantProvider _tenantProvider = Substitute.For<ITenantProvider>();
    private readonly ProviderPortalController _controller;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _providerId = Guid.NewGuid();

    public ProviderPortalControllerTests()
    {
        _tenantProvider.GetTenantId().Returns(_tenantId);
        _controller = new ProviderPortalController(_portalRepo, _tenantProvider);
    }

    // --- GetOrders ---

    [Fact]
    public async Task GetOrders_SiparisleriDondurur()
    {
        var orders = new List<Order>
        {
            new() { Id = Guid.NewGuid(), OrderNumber = "ORD-001" },
            new() { Id = Guid.NewGuid(), OrderNumber = "ORD-002" }
        };
        _portalRepo.GetOrdersByProviderAsync(_tenantId, _providerId, 1, 50).Returns(orders);

        var result = await _controller.GetOrders(_providerId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<Order>>>().Subject;
        response.Success.Should().BeTrue();
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetOrders_SayfalamaParametreleriIletilir()
    {
        _portalRepo.GetOrdersByProviderAsync(_tenantId, _providerId, 3, 25).Returns(new List<Order>());

        await _controller.GetOrders(_providerId, page: 3, pageSize: 25);

        await _portalRepo.Received(1).GetOrdersByProviderAsync(_tenantId, _providerId, 3, 25);
    }

    [Fact]
    public async Task GetOrders_VarsayilanSayfalamaKullanir()
    {
        _portalRepo.GetOrdersByProviderAsync(_tenantId, _providerId, 1, 50).Returns(new List<Order>());

        await _controller.GetOrders(_providerId);

        await _portalRepo.Received(1).GetOrdersByProviderAsync(_tenantId, _providerId, 1, 50);
    }

    // --- GetVehicles ---

    [Fact]
    public async Task GetVehicles_AraclariDondurur()
    {
        var vehicles = new List<Vehicle>
        {
            new() { Id = Guid.NewGuid(), PlateNumber = "34 ABC 123" },
            new() { Id = Guid.NewGuid(), PlateNumber = "06 DEF 456" }
        };
        _portalRepo.GetVehiclesByProviderAsync(_tenantId, _providerId).Returns(vehicles);

        var result = await _controller.GetVehicles(_providerId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<Vehicle>>>().Subject;
        response.Success.Should().BeTrue();
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetVehicles_DogruTenantIdKullanir()
    {
        _portalRepo.GetVehiclesByProviderAsync(_tenantId, _providerId).Returns(new List<Vehicle>());

        await _controller.GetVehicles(_providerId);

        await _portalRepo.Received(1).GetVehiclesByProviderAsync(_tenantId, _providerId);
    }

    // --- GetDrivers ---

    [Fact]
    public async Task GetDrivers_SuruculeriDondurur()
    {
        var drivers = new List<Driver>
        {
            new() { Id = Guid.NewGuid(), FullName = "Ali Yilmaz" }
        };
        _portalRepo.GetDriversByProviderAsync(_tenantId, _providerId).Returns(drivers);

        var result = await _controller.GetDrivers(_providerId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<Driver>>>().Subject;
        response.Success.Should().BeTrue();
        response.Data.Should().HaveCount(1);
    }

    // --- GetShipments ---

    [Fact]
    public async Task GetShipments_SevkiyatlariDondurur()
    {
        var shipments = new List<Shipment>
        {
            new() { Id = Guid.NewGuid(), ShipmentNumber = "SHP-001" }
        };
        _portalRepo.GetShipmentsByProviderAsync(_tenantId, _providerId, 1, 50).Returns(shipments);

        var result = await _controller.GetShipments(_providerId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<Shipment>>>().Subject;
        response.Success.Should().BeTrue();
        response.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetShipments_SayfalamaParametreleriIletilir()
    {
        _portalRepo.GetShipmentsByProviderAsync(_tenantId, _providerId, 2, 10).Returns(new List<Shipment>());

        await _controller.GetShipments(_providerId, page: 2, pageSize: 10);

        await _portalRepo.Received(1).GetShipmentsByProviderAsync(_tenantId, _providerId, 2, 10);
    }

    // --- GetStats ---

    [Fact]
    public async Task GetStats_IstatistikleriDondurur()
    {
        var stats = new ProviderPortalStats
        {
            TotalOrders = 150,
            ActiveShipments = 25,
            TotalVehicles = 10,
            TotalDrivers = 15,
            CompletedShipments = 120,
            PendingOrders = 5
        };
        _portalRepo.GetStatsAsync(_tenantId, _providerId).Returns(stats);

        var result = await _controller.GetStats(_providerId);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<ProviderPortalStats>>().Subject;
        response.Success.Should().BeTrue();
        response.Data!.TotalOrders.Should().Be(150);
        response.Data.ActiveShipments.Should().Be(25);
        response.Data.TotalVehicles.Should().Be(10);
        response.Data.TotalDrivers.Should().Be(15);
        response.Data.CompletedShipments.Should().Be(120);
        response.Data.PendingOrders.Should().Be(5);
    }

    [Fact]
    public async Task GetStats_DogruTenantVeProviderIdKullanir()
    {
        _portalRepo.GetStatsAsync(_tenantId, _providerId).Returns(new ProviderPortalStats());

        await _controller.GetStats(_providerId);

        await _portalRepo.Received(1).GetStatsAsync(_tenantId, _providerId);
    }

    // --- Tenant Isolation ---

    [Fact]
    public async Task TenantIsolation_TumEndpointlerTenantIdKullanir()
    {
        _portalRepo.GetOrdersByProviderAsync(_tenantId, _providerId, 1, 50).Returns(new List<Order>());
        _portalRepo.GetVehiclesByProviderAsync(_tenantId, _providerId).Returns(new List<Vehicle>());
        _portalRepo.GetDriversByProviderAsync(_tenantId, _providerId).Returns(new List<Driver>());
        _portalRepo.GetShipmentsByProviderAsync(_tenantId, _providerId, 1, 50).Returns(new List<Shipment>());
        _portalRepo.GetStatsAsync(_tenantId, _providerId).Returns(new ProviderPortalStats());

        await _controller.GetOrders(_providerId);
        await _controller.GetVehicles(_providerId);
        await _controller.GetDrivers(_providerId);
        await _controller.GetShipments(_providerId);
        await _controller.GetStats(_providerId);

        await _portalRepo.Received(1).GetOrdersByProviderAsync(_tenantId, Arg.Any<Guid>(), Arg.Any<int>(), Arg.Any<int>());
        await _portalRepo.Received(1).GetVehiclesByProviderAsync(_tenantId, Arg.Any<Guid>());
        await _portalRepo.Received(1).GetDriversByProviderAsync(_tenantId, Arg.Any<Guid>());
        await _portalRepo.Received(1).GetShipmentsByProviderAsync(_tenantId, Arg.Any<Guid>(), Arg.Any<int>(), Arg.Any<int>());
        await _portalRepo.Received(1).GetStatsAsync(_tenantId, Arg.Any<Guid>());
    }
}
