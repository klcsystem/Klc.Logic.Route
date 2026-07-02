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

public class LocationsControllerTests
{
    private readonly ILocationRepository _locationRepo = Substitute.For<ILocationRepository>();
    private readonly ITenantProvider _tenantProvider = Substitute.For<ITenantProvider>();
    private readonly LocationsController _controller;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly string _userId = "test-user";

    public LocationsControllerTests()
    {
        _tenantProvider.GetTenantId().Returns(_tenantId);
        _tenantProvider.GetUserId().Returns(_userId);
        _controller = new LocationsController(_locationRepo, _tenantProvider);
    }

    private Location CreateTestLocation(Guid? id = null)
    {
        return new Location
        {
            Id = id ?? Guid.NewGuid(),
            TenantId = _tenantId,
            Name = "Istanbul Depo",
            Code = "IST-01",
            LocationType = LocationType.Depot,
            Address = "Tuzla Lojistik Bolgesi",
            City = "Istanbul",
            District = "Tuzla",
            Latitude = 40.8220,
            Longitude = 29.3006,
            IsActive = true,
            Capacity = 500,
            WorkingHours = "08:00-18:00",
            ContactName = "Ahmet Yilmaz",
            ContactPhone = "+905551234567"
        };
    }

    // --- GetAll ---

    [Fact]
    public async Task GetAll_TenantLokasyonlariniDondurur()
    {
        var locations = new List<Location> { CreateTestLocation(), CreateTestLocation() };
        _locationRepo.GetAllAsync(_tenantId).Returns(locations);

        var result = await _controller.GetAll();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<List<Location>>>().Subject;
        response.Success.Should().BeTrue();
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAll_BosListe_BosResponseDondurur()
    {
        _locationRepo.GetAllAsync(_tenantId).Returns(new List<Location>());

        var result = await _controller.GetAll();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<List<Location>>>().Subject;
        response.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAll_DogruTenantIdKullanir()
    {
        _locationRepo.GetAllAsync(_tenantId).Returns(new List<Location>());

        await _controller.GetAll();

        await _locationRepo.Received(1).GetAllAsync(_tenantId);
    }

    // --- GetById ---

    [Fact]
    public async Task GetById_VarOlanLokasyon_OkDondurur()
    {
        var location = CreateTestLocation();
        _locationRepo.GetByIdAsync(location.Id, _tenantId).Returns(location);

        var result = await _controller.GetById(location.Id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<Location>>().Subject;
        response.Success.Should().BeTrue();
        response.Data!.Name.Should().Be("Istanbul Depo");
    }

    [Fact]
    public async Task GetById_OlmayanLokasyon_NotFoundDondurur()
    {
        var id = Guid.NewGuid();
        _locationRepo.GetByIdAsync(id, _tenantId).Returns((Location?)null);

        var result = await _controller.GetById(id);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    // --- Create ---

    [Fact]
    public async Task Create_GecerliLokasyon_CreatedDondurur()
    {
        var location = CreateTestLocation();
        _locationRepo.InsertAsync(Arg.Any<Location>()).Returns(location.Id);

        var result = await _controller.Create(location);

        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var response = createdResult.Value.Should().BeOfType<ApiResponse<Guid>>().Subject;
        response.Data.Should().Be(location.Id);
    }

    [Fact]
    public async Task Create_TenantIdOtomatikAtanir()
    {
        var location = new Location { Name = "Test", TenantId = Guid.Empty };
        _locationRepo.InsertAsync(Arg.Any<Location>()).Returns(location.Id);

        await _controller.Create(location);

        await _locationRepo.Received(1).InsertAsync(Arg.Is<Location>(l => l.TenantId == _tenantId));
    }

    [Fact]
    public async Task Create_CreatedByOtomatikAtanir()
    {
        var location = new Location { Name = "Test" };
        _locationRepo.InsertAsync(Arg.Any<Location>()).Returns(location.Id);

        await _controller.Create(location);

        await _locationRepo.Received(1).InsertAsync(Arg.Is<Location>(l => l.CreatedBy == _userId));
    }

    // --- Update ---

    [Fact]
    public async Task Update_VarOlanLokasyon_OkDondurur()
    {
        var id = Guid.NewGuid();
        _locationRepo.GetByIdAsync(id, _tenantId).Returns(CreateTestLocation(id));

        var updated = CreateTestLocation(id);
        updated.Name = "Ankara Depo";

        var result = await _controller.Update(id, updated);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<bool>>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Update_OlmayanLokasyon_NotFoundDondurur()
    {
        var id = Guid.NewGuid();
        _locationRepo.GetByIdAsync(id, _tenantId).Returns((Location?)null);

        var result = await _controller.Update(id, new Location());

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Update_IdVeTenantIdDogruAtanir()
    {
        var id = Guid.NewGuid();
        _locationRepo.GetByIdAsync(id, _tenantId).Returns(CreateTestLocation(id));

        var location = new Location { Name = "Updated" };
        await _controller.Update(id, location);

        await _locationRepo.Received(1).UpdateAsync(Arg.Is<Location>(l =>
            l.Id == id && l.TenantId == _tenantId && l.UpdatedBy == _userId));
    }

    // --- Delete ---

    [Fact]
    public async Task Delete_VarOlanLokasyon_OkDondurur()
    {
        var id = Guid.NewGuid();
        _locationRepo.GetByIdAsync(id, _tenantId).Returns(CreateTestLocation(id));

        var result = await _controller.Delete(id);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<bool>>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Delete_OlmayanLokasyon_NotFoundDondurur()
    {
        var id = Guid.NewGuid();
        _locationRepo.GetByIdAsync(id, _tenantId).Returns((Location?)null);

        var result = await _controller.Delete(id);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Delete_DogruTenantIleCalisiyor()
    {
        var id = Guid.NewGuid();
        _locationRepo.GetByIdAsync(id, _tenantId).Returns(CreateTestLocation(id));

        await _controller.Delete(id);

        await _locationRepo.Received(1).DeleteAsync(id, _tenantId);
    }

    // --- Tenant Isolation ---

    [Fact]
    public async Task TenantIsolation_FarkliTenantVerisineErisemez()
    {
        var locationId = Guid.NewGuid();
        _locationRepo.GetByIdAsync(locationId, _tenantId).Returns((Location?)null);

        var result = await _controller.GetById(locationId);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }
}
