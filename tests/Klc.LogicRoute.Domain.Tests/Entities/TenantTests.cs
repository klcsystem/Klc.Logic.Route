using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class TenantTests
{
    [Fact]
    public void Tenant_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        // Act
        var tenant = new Tenant();

        // Assert
        tenant.Id.Should().NotBeEmpty();
        tenant.Name.Should().BeEmpty();
        tenant.IsActive.Should().BeTrue();
        tenant.Domain.Should().BeNull();
        tenant.ApiKey.Should().BeNull();
        tenant.Settings.Should().BeNull();
        tenant.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Tenant_TumAlanlarAtanabilmeli()
    {
        // Act
        var tenant = new Tenant
        {
            Name = "Klc System",
            Domain = "klcsystem.com",
            IsActive = true,
            ApiKey = "api-key-123",
            Settings = "{\"theme\": \"dark\"}"
        };

        // Assert
        tenant.Name.Should().Be("Klc System");
        tenant.Domain.Should().Be("klcsystem.com");
        tenant.ApiKey.Should().Be("api-key-123");
        tenant.Settings.Should().Contain("dark");
    }
}
