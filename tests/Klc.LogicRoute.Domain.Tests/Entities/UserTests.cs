using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class UserTests
{
    [Fact]
    public void User_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        // Act
        var user = new User();

        // Assert
        user.Id.Should().NotBeEmpty();
        user.Email.Should().BeEmpty();
        user.FirstName.Should().BeEmpty();
        user.LastName.Should().BeEmpty();
        user.IsActive.Should().BeTrue();
        user.PasswordHash.Should().BeNull();
        user.LastLoginAt.Should().BeNull();
        user.UpdatedAt.Should().BeNull();
        user.Role.Should().BeNull();
    }

    [Fact]
    public void User_CreatedAt_OtomatikAyarlanmali()
    {
        // Act
        var user = new User();

        // Assert
        user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void User_IdBenzersizOlmali()
    {
        // Act
        var user1 = new User();
        var user2 = new User();

        // Assert
        user1.Id.Should().NotBe(user2.Id);
    }

    [Fact]
    public void User_TumAlanlarAtanabilmeli()
    {
        // Arrange
        var id = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        // Act
        var user = new User
        {
            Id = id,
            TenantId = tenantId,
            Email = "test@klcsystem.com",
            PasswordHash = "hashed",
            FirstName = "Ibrahim",
            LastName = "Kilic",
            IsActive = true,
            RoleId = roleId,
            LastLoginAt = DateTime.UtcNow
        };

        // Assert
        user.Id.Should().Be(id);
        user.TenantId.Should().Be(tenantId);
        user.Email.Should().Be("test@klcsystem.com");
        user.PasswordHash.Should().Be("hashed");
        user.FirstName.Should().Be("Ibrahim");
        user.LastName.Should().Be("Kilic");
        user.IsActive.Should().BeTrue();
        user.RoleId.Should().Be(roleId);
        user.LastLoginAt.Should().NotBeNull();
    }

    [Fact]
    public void User_RoleNavigasyonuNullOlabilir()
    {
        // Act
        var user = new User();

        // Assert
        user.Role.Should().BeNull();
    }
}
