using FluentAssertions;
using NSubstitute;
using Klc.LogicRoute.Application.InvoiceAudit;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.Tests.InvoiceAudit;

public class InvoiceAuditServiceTests
{
    private readonly IShipmentRepository _shipmentRepo;
    private readonly IInvoiceAuditRepository _invoiceAuditRepo;
    private readonly InvoiceAuditService _service;
    private readonly Guid _tenantId = Guid.NewGuid();

    public InvoiceAuditServiceTests()
    {
        _shipmentRepo = Substitute.For<IShipmentRepository>();
        _invoiceAuditRepo = Substitute.For<IInvoiceAuditRepository>();
        _service = new InvoiceAuditService(_shipmentRepo, _invoiceAuditRepo);
    }

    private Shipment CreateTestShipment(decimal calculatedPrice = 5000)
    {
        return new Shipment
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            ShipmentNumber = "SHP-001",
            SelectedProviderId = Guid.NewGuid(),
            CalculatedPrice = calculatedPrice,
            Currency = "TRY"
        };
    }

    [Fact]
    public async Task AuditAsync_FarkYuzde1Altinda_ApprovedDonmeli()
    {
        // %0.5 fark — 5000 * 1.005 = 5025
        var shipment = CreateTestShipment(5000);
        _shipmentRepo.GetByIdAsync(shipment.Id, _tenantId).Returns(shipment);

        var result = await _service.AuditAsync(shipment.Id, "INV-001", 5025, _tenantId);

        result.Status.Should().Be("Approved");
        result.DifferencePercent.Should().Be(0.5m);
        result.Difference.Should().Be(25);
    }

    [Fact]
    public async Task AuditAsync_FarkTamYuzde1_ApprovedDonmeli()
    {
        // %1 fark — 5000 * 1.01 = 5050
        var shipment = CreateTestShipment(5000);
        _shipmentRepo.GetByIdAsync(shipment.Id, _tenantId).Returns(shipment);

        var result = await _service.AuditAsync(shipment.Id, "INV-001", 5050, _tenantId);

        result.Status.Should().Be("Approved");
        result.DifferencePercent.Should().Be(1);
    }

    [Fact]
    public async Task AuditAsync_FarkYuzde1ile5Arasi_NeedsReviewDonmeli()
    {
        // %3 fark — 5000 * 1.03 = 5150
        var shipment = CreateTestShipment(5000);
        _shipmentRepo.GetByIdAsync(shipment.Id, _tenantId).Returns(shipment);

        var result = await _service.AuditAsync(shipment.Id, "INV-001", 5150, _tenantId);

        result.Status.Should().Be("NeedsReview");
        result.DifferencePercent.Should().Be(3);
    }

    [Fact]
    public async Task AuditAsync_FarkTamYuzde5_NeedsReviewDonmeli()
    {
        // %5 fark — 5000 * 1.05 = 5250
        var shipment = CreateTestShipment(5000);
        _shipmentRepo.GetByIdAsync(shipment.Id, _tenantId).Returns(shipment);

        var result = await _service.AuditAsync(shipment.Id, "INV-001", 5250, _tenantId);

        result.Status.Should().Be("NeedsReview");
        result.DifferencePercent.Should().Be(5);
    }

    [Fact]
    public async Task AuditAsync_FarkYuzde5Uzerinde_FlaggedDonmeli()
    {
        // %10 fark — 5000 * 1.10 = 5500
        var shipment = CreateTestShipment(5000);
        _shipmentRepo.GetByIdAsync(shipment.Id, _tenantId).Returns(shipment);

        var result = await _service.AuditAsync(shipment.Id, "INV-001", 5500, _tenantId);

        result.Status.Should().Be("Flagged");
        result.DifferencePercent.Should().Be(10);
    }

    [Fact]
    public async Task AuditAsync_FaturaDusuk_NegatifFark()
    {
        // Fatura beklentiden dusuk: 4500 vs 5000 = -%10
        var shipment = CreateTestShipment(5000);
        _shipmentRepo.GetByIdAsync(shipment.Id, _tenantId).Returns(shipment);

        var result = await _service.AuditAsync(shipment.Id, "INV-001", 4500, _tenantId);

        result.Difference.Should().Be(-500);
        result.DifferencePercent.Should().Be(-10);
        result.Status.Should().Be("Flagged");
    }

    [Fact]
    public async Task AuditAsync_FaturaEsit_ApprovedDonmeli()
    {
        var shipment = CreateTestShipment(5000);
        _shipmentRepo.GetByIdAsync(shipment.Id, _tenantId).Returns(shipment);

        var result = await _service.AuditAsync(shipment.Id, "INV-001", 5000, _tenantId);

        result.Status.Should().Be("Approved");
        result.Difference.Should().Be(0);
        result.DifferencePercent.Should().Be(0);
    }

    [Fact]
    public async Task AuditAsync_SevkiyatBulunamaz_KeyNotFoundExceptionFirlatmali()
    {
        _shipmentRepo.GetByIdAsync(Arg.Any<Guid>(), _tenantId).Returns((Shipment?)null);

        var act = () => _service.AuditAsync(Guid.NewGuid(), "INV-001", 5000, _tenantId);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*bulunamadi*");
    }

    [Fact]
    public async Task AuditAsync_RepositoryInsertCagrilmali()
    {
        var shipment = CreateTestShipment(5000);
        _shipmentRepo.GetByIdAsync(shipment.Id, _tenantId).Returns(shipment);

        await _service.AuditAsync(shipment.Id, "INV-001", 5000, _tenantId);

        await _invoiceAuditRepo.Received(1).InsertAsync(Arg.Is<Domain.Entities.InvoiceAudit>(a =>
            a.ShipmentId == shipment.Id &&
            a.InvoiceNumber == "INV-001" &&
            a.TenantId == _tenantId));
    }
}
