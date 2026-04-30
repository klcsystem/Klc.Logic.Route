using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class InvoiceAuditTests
{
    [Fact]
    public void InvoiceAudit_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        var audit = new InvoiceAudit();

        audit.Id.Should().NotBeEmpty();
        audit.InvoiceAmount.Should().Be(0);
        audit.ExpectedAmount.Should().Be(0);
        audit.Difference.Should().Be(0);
        audit.DifferencePercent.Should().Be(0);
        audit.Currency.Should().Be("TRY");
        audit.Status.Should().Be("Pending");
        audit.AuditNotes.Should().BeNull();
        audit.ReviewedAt.Should().BeNull();
        audit.ReviewedBy.Should().BeNull();
    }

    [Fact]
    public void InvoiceAudit_FarkHesaplamaDogruOlmali()
    {
        decimal invoiceAmount = 5250;
        decimal expectedAmount = 5000;
        var difference = invoiceAmount - expectedAmount;
        var differencePercent = difference / expectedAmount * 100;

        var audit = new InvoiceAudit
        {
            InvoiceAmount = invoiceAmount,
            ExpectedAmount = expectedAmount,
            Difference = difference,
            DifferencePercent = differencePercent
        };

        audit.Difference.Should().Be(250);
        audit.DifferencePercent.Should().Be(5);
    }

    [Theory]
    [InlineData("Pending")]
    [InlineData("Approved")]
    [InlineData("NeedsReview")]
    [InlineData("Flagged")]
    [InlineData("Rejected")]
    public void InvoiceAudit_TumStatusDegerleriAtanabilmeli(string status)
    {
        var audit = new InvoiceAudit { Status = status };
        audit.Status.Should().Be(status);
    }

    [Fact]
    public void InvoiceAudit_IncelendiIsaretlenebilmeli()
    {
        var audit = new InvoiceAudit
        {
            Status = "Approved",
            ReviewedAt = DateTime.UtcNow,
            ReviewedBy = "admin@klcsystem.com",
            AuditNotes = "Fatura uygun"
        };

        audit.ReviewedAt.Should().NotBeNull();
        audit.ReviewedBy.Should().Be("admin@klcsystem.com");
    }
}
