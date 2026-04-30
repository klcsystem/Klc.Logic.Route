using FluentAssertions;
using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Tests.Entities;

public class OperationClaimTests
{
    [Fact]
    public void OperationClaim_Olusturuldiginda_VarsayilanDegerlerDogruOlmali()
    {
        // Act
        var claim = new OperationClaim();

        // Assert
        claim.Id.Should().NotBeEmpty();
        claim.Name.Should().BeEmpty();
        claim.Description.Should().BeNull();
        claim.IsSystemRole.Should().BeFalse();
        claim.Permissions.Should().BeEmpty();
        claim.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void OperationClaim_PermissionsListesiBaslatilmali()
    {
        // Act
        var claim = new OperationClaim();

        // Assert
        claim.Permissions.Should().NotBeNull();
        claim.Permissions.Should().BeEmpty();
    }

    [Fact]
    public void OperationClaim_PermissionEklenebilmeli()
    {
        // Arrange
        var claim = new OperationClaim { Name = "Admin" };
        var permission = new UserOperationClaim { Permission = "users.read" };

        // Act
        claim.Permissions.Add(permission);

        // Assert
        claim.Permissions.Should().HaveCount(1);
        claim.Permissions.First().Permission.Should().Be("users.read");
    }
}
