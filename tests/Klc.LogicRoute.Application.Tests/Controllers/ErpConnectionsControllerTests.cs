using FluentAssertions;
using Klc.LogicRoute.Api.Controllers;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;

namespace Klc.LogicRoute.Application.Tests.Controllers;

public class ErpConnectionsControllerTests
{
    private readonly IErpConnectionRepository _erpRepo = Substitute.For<IErpConnectionRepository>();
    private readonly IErpAdapter _genericAdapter = Substitute.For<IErpAdapter>();
    private readonly ITenantProvider _tenantProvider = Substitute.For<ITenantProvider>();
    private readonly ErpConnectionsController _controller;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly string _userId = "test-user";

    public ErpConnectionsControllerTests()
    {
        _tenantProvider.GetTenantId().Returns(_tenantId);
        _tenantProvider.GetUserId().Returns(_userId);
        _genericAdapter.SupportedType.Returns(ErpType.Generic);
        _controller = new ErpConnectionsController(_erpRepo, new[] { _genericAdapter }, _tenantProvider);
    }

    private ErpConnection CreateTestConnection(Guid? id = null)
    {
        return new ErpConnection
        {
            Id = id ?? Guid.NewGuid(),
            TenantId = _tenantId,
            Name = "SAP Test",
            ErpType = ErpType.SapS4Hana,
            EndpointUrl = "https://sap.test.com/api",
            Username = "rfc_user",
            Password = "encrypted",
            IsActive = true
        };
    }

    // --- GetAll ---

    [Fact]
    public async Task GetAll_TenantBaglantilariniDondurur()
    {
        var connections = new List<ErpConnection> { CreateTestConnection(), CreateTestConnection() };
        _erpRepo.GetAllAsync(_tenantId).Returns(connections);

        var result = await _controller.GetAll();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<ErpConnection>>>().Subject;
        response.Success.Should().BeTrue();
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAll_BosTenant_BosListeDondurur()
    {
        _erpRepo.GetAllAsync(_tenantId).Returns(new List<ErpConnection>());

        var result = await _controller.GetAll();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<ErpConnection>>>().Subject;
        response.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAll_DogruTenantIdKullanir()
    {
        _erpRepo.GetAllAsync(_tenantId).Returns(new List<ErpConnection>());

        await _controller.GetAll();

        await _erpRepo.Received(1).GetAllAsync(_tenantId);
    }

    // --- GetById ---

    [Fact]
    public async Task GetById_VarOlanBaglanti_OkDondurur()
    {
        var conn = CreateTestConnection();
        _erpRepo.GetByIdAsync(conn.Id, _tenantId).Returns(conn);

        var result = await _controller.GetById(conn.Id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<ErpConnection>>().Subject;
        response.Success.Should().BeTrue();
        response.Data!.Name.Should().Be("SAP Test");
    }

    [Fact]
    public async Task GetById_OlmayanBaglanti_NotFoundDondurur()
    {
        var id = Guid.NewGuid();
        _erpRepo.GetByIdAsync(id, _tenantId).Returns((ErpConnection?)null);

        var result = await _controller.GetById(id);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    // --- Create ---

    [Fact]
    public async Task Create_GecerliBaglanti_CreatedDondurur()
    {
        var conn = CreateTestConnection();
        _erpRepo.InsertAsync(Arg.Any<ErpConnection>()).Returns(conn.Id);

        var result = await _controller.Create(conn);

        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var response = createdResult.Value.Should().BeOfType<ApiResponse<Guid>>().Subject;
        response.Data.Should().Be(conn.Id);
    }

    [Fact]
    public async Task Create_TenantIdOtomatikAtanir()
    {
        var conn = new ErpConnection { Name = "Test", TenantId = Guid.Empty };
        _erpRepo.InsertAsync(Arg.Any<ErpConnection>()).Returns(conn.Id);

        await _controller.Create(conn);

        await _erpRepo.Received(1).InsertAsync(Arg.Is<ErpConnection>(c => c.TenantId == _tenantId));
    }

    [Fact]
    public async Task Create_CreatedByOtomatikAtanir()
    {
        var conn = new ErpConnection { Name = "Test" };
        _erpRepo.InsertAsync(Arg.Any<ErpConnection>()).Returns(conn.Id);

        await _controller.Create(conn);

        await _erpRepo.Received(1).InsertAsync(Arg.Is<ErpConnection>(c => c.CreatedBy == _userId));
    }

    // --- Update ---

    [Fact]
    public async Task Update_VarOlanBaglanti_OkDondurur()
    {
        var id = Guid.NewGuid();
        var existing = CreateTestConnection(id);
        _erpRepo.GetByIdAsync(id, _tenantId).Returns(existing);

        var updated = CreateTestConnection(id);
        updated.Name = "SAP Updated";

        var result = await _controller.Update(id, updated);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<bool>>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Update_OlmayanBaglanti_NotFoundDondurur()
    {
        var id = Guid.NewGuid();
        _erpRepo.GetByIdAsync(id, _tenantId).Returns((ErpConnection?)null);

        var result = await _controller.Update(id, new ErpConnection());

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Update_IdVeTenantIdDogruAtanir()
    {
        var id = Guid.NewGuid();
        _erpRepo.GetByIdAsync(id, _tenantId).Returns(CreateTestConnection(id));

        var conn = new ErpConnection { Name = "New Name" };
        await _controller.Update(id, conn);

        await _erpRepo.Received(1).UpdateAsync(Arg.Is<ErpConnection>(c =>
            c.Id == id && c.TenantId == _tenantId && c.UpdatedBy == _userId));
    }

    // --- Delete ---

    [Fact]
    public async Task Delete_VarOlanBaglanti_OkDondurur()
    {
        var id = Guid.NewGuid();
        _erpRepo.GetByIdAsync(id, _tenantId).Returns(CreateTestConnection(id));

        var result = await _controller.Delete(id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<bool>>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Delete_OlmayanBaglanti_NotFoundDondurur()
    {
        var id = Guid.NewGuid();
        _erpRepo.GetByIdAsync(id, _tenantId).Returns((ErpConnection?)null);

        var result = await _controller.Delete(id);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Delete_DogruTenantIleCalisiyor()
    {
        var id = Guid.NewGuid();
        _erpRepo.GetByIdAsync(id, _tenantId).Returns(CreateTestConnection(id));

        await _controller.Delete(id);

        await _erpRepo.Received(1).DeleteAsync(id, _tenantId);
    }

    // --- TestConnection ---

    [Fact]
    public async Task TestConnection_BasariliBaglanti_TrueDondurur()
    {
        var id = Guid.NewGuid();
        var conn = CreateTestConnection(id);
        _erpRepo.GetByIdAsync(id, _tenantId).Returns(conn);

        var sapAdapter = Substitute.For<IErpAdapter>();
        sapAdapter.SupportedType.Returns(ErpType.SapS4Hana);
        sapAdapter.TestConnectionAsync(conn).Returns(true);

        var controller = new ErpConnectionsController(
            _erpRepo, new[] { sapAdapter, _genericAdapter }, _tenantProvider);

        var result = await controller.TestConnection(id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<bool>>().Subject;
        response.Data.Should().BeTrue();
    }

    [Fact]
    public async Task TestConnection_OlmayanBaglanti_NotFoundDondurur()
    {
        var id = Guid.NewGuid();
        _erpRepo.GetByIdAsync(id, _tenantId).Returns((ErpConnection?)null);

        var result = await _controller.TestConnection(id);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task TestConnection_BasarisizBaglanti_SyncStatusGunceller()
    {
        var id = Guid.NewGuid();
        var conn = CreateTestConnection(id);
        _erpRepo.GetByIdAsync(id, _tenantId).Returns(conn);
        _genericAdapter.TestConnectionAsync(conn).Returns(false);

        // Generic adapter used as fallback since no SapS4Hana adapter matches
        var controller = new ErpConnectionsController(
            _erpRepo, new[] { _genericAdapter }, _tenantProvider);

        await controller.TestConnection(id);

        await _erpRepo.Received(1).UpdateSyncStatusAsync(id, _tenantId, "Failed");
    }

    // --- Tenant Isolation ---

    [Fact]
    public async Task TenantIsolation_FarkliTenantVerisineErisemez()
    {
        var connectionId = Guid.NewGuid();
        var otherTenantId = Guid.NewGuid();

        // Repository returns null because connection belongs to another tenant
        _erpRepo.GetByIdAsync(connectionId, _tenantId).Returns((ErpConnection?)null);

        var result = await _controller.GetById(connectionId);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }
}
