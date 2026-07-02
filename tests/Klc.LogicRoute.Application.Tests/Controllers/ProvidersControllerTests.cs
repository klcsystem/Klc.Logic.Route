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

public class ProvidersControllerTests
{
    private readonly IProviderRepository _providerRepo = Substitute.For<IProviderRepository>();
    private readonly ITenantProvider _tenantProvider = Substitute.For<ITenantProvider>();
    private readonly ProvidersController _controller;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly string _userId = "test-user";

    public ProvidersControllerTests()
    {
        _tenantProvider.GetTenantId().Returns(_tenantId);
        _tenantProvider.GetUserId().Returns(_userId);
        _controller = new ProvidersController(_providerRepo, _tenantProvider);
    }

    private Provider CreateTestProvider(Guid? id = null)
    {
        return new Provider
        {
            Id = id ?? Guid.NewGuid(),
            TenantId = _tenantId,
            Name = "Aras Kargo",
            Code = "ARAS-001",
            Type = ProviderType.DirectCarrier,
            IsActive = true,
            IntegrationMode = IntegrationMode.Managed,
            TaxNumber = "1234567890",
            Address = "Istanbul Merkez",
            City = "Istanbul",
            Phone = "+905551234567",
            Email = "info@araskargo.com",
            ContactPerson = "Ahmet Yilmaz",
            ServiceRegions = "Marmara,Ic Anadolu",
            SupportedVehicleTypes = "Tir,Kamyon"
        };
    }

    // --- GetAll ---

    [Fact]
    public async Task GetAll_TenantTedarikcilariniDondurur()
    {
        var providers = new List<Provider> { CreateTestProvider(), CreateTestProvider() };
        _providerRepo.GetAllAsync(_tenantId).Returns(providers);

        var result = await _controller.GetAll();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<Provider>>>().Subject;
        response.Success.Should().BeTrue();
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAll_BosListe_BosResponseDondurur()
    {
        _providerRepo.GetAllAsync(_tenantId).Returns(new List<Provider>());

        var result = await _controller.GetAll();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<IEnumerable<Provider>>>().Subject;
        response.Data.Should().BeEmpty();
    }

    // --- GetById ---

    [Fact]
    public async Task GetById_VarOlanTedarikci_OkDondurur()
    {
        var provider = CreateTestProvider();
        _providerRepo.GetByIdAsync(provider.Id, _tenantId).Returns(provider);

        var result = await _controller.GetById(provider.Id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<Provider>>().Subject;
        response.Success.Should().BeTrue();
        response.Data!.Name.Should().Be("Aras Kargo");
    }

    [Fact]
    public async Task GetById_OlmayanTedarikci_NotFoundDondurur()
    {
        var id = Guid.NewGuid();
        _providerRepo.GetByIdAsync(id, _tenantId).Returns((Provider?)null);

        var result = await _controller.GetById(id);

        var notFoundResult = result.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
        var response = notFoundResult.Value.Should().BeOfType<ApiResponse<Provider>>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("bulunamadi");
    }

    // --- Create ---

    [Fact]
    public async Task Create_GecerliTedarikci_CreatedDondurur()
    {
        var provider = CreateTestProvider();
        _providerRepo.InsertAsync(Arg.Any<Provider>()).Returns(provider.Id);

        var result = await _controller.Create(provider);

        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var response = createdResult.Value.Should().BeOfType<ApiResponse<Guid>>().Subject;
        response.Data.Should().Be(provider.Id);
    }

    [Fact]
    public async Task Create_TenantIdOtomatikAtanir()
    {
        var provider = new Provider { Name = "Test", TenantId = Guid.Empty };
        _providerRepo.InsertAsync(Arg.Any<Provider>()).Returns(provider.Id);

        await _controller.Create(provider);

        await _providerRepo.Received(1).InsertAsync(Arg.Is<Provider>(p => p.TenantId == _tenantId));
    }

    [Fact]
    public async Task Create_CreatedByOtomatikAtanir()
    {
        var provider = new Provider { Name = "Test" };
        _providerRepo.InsertAsync(Arg.Any<Provider>()).Returns(provider.Id);

        await _controller.Create(provider);

        await _providerRepo.Received(1).InsertAsync(Arg.Is<Provider>(p => p.CreatedBy == _userId));
    }

    // --- Update ---

    [Fact]
    public async Task Update_VarOlanTedarikci_OkDondurur()
    {
        var id = Guid.NewGuid();
        var updated = CreateTestProvider(id);
        updated.Name = "MNG Kargo";

        var result = await _controller.Update(id, updated);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<bool>>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Update_IdVeTenantIdDogruAtanir()
    {
        var id = Guid.NewGuid();
        var provider = new Provider { Name = "Updated" };

        await _controller.Update(id, provider);

        await _providerRepo.Received(1).UpdateAsync(Arg.Is<Provider>(p =>
            p.Id == id && p.TenantId == _tenantId && p.UpdatedBy == _userId));
    }

    // --- Delete ---

    [Fact]
    public async Task Delete_VarOlanTedarikci_OkDondurur()
    {
        var id = Guid.NewGuid();

        var result = await _controller.Delete(id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<bool>>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Delete_DogruTenantIleCalisiyor()
    {
        var id = Guid.NewGuid();

        await _controller.Delete(id);

        await _providerRepo.Received(1).DeleteAsync(id, _tenantId);
    }

    // --- Tenant Isolation ---

    [Fact]
    public async Task TenantIsolation_FarkliTenantVerisineErisemez()
    {
        var providerId = Guid.NewGuid();
        _providerRepo.GetByIdAsync(providerId, _tenantId).Returns((Provider?)null);

        var result = await _controller.GetById(providerId);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }
}
