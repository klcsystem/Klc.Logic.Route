using FluentAssertions;
using NSubstitute;
using Klc.LogicRoute.Application.Auth.Commands;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.Tests.Auth;

public class RegisterHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly RegisterHandler _handler;
    private readonly Guid _tenantId = Guid.NewGuid();

    public RegisterHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _roleRepository = Substitute.For<IRoleRepository>();
        _handler = new RegisterHandler(_userRepository, _roleRepository);
    }

    [Fact]
    public async Task Handle_BasariliKayit_AuthResponseDtoDoner()
    {
        // Arrange
        var viewerRole = new OperationClaim
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Name = "Viewer"
        };

        _userRepository.GetByEmailAsync("new@klcsystem.com", _tenantId).Returns((User?)null);
        _roleRepository.GetByNameAsync("Viewer", _tenantId).Returns(viewerRole);
        _roleRepository.GetPermissionsAsync(viewerRole.Id).Returns(new List<string> { "dashboard.read" });
        _userRepository.InsertAsync(Arg.Any<User>()).Returns(Guid.NewGuid());

        var command = new RegisterCommand("new@klcsystem.com", "Password123!", "Yeni", "Kullanici", _tenantId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be("new@klcsystem.com");
        result.FirstName.Should().Be("Yeni");
        result.LastName.Should().Be("Kullanici");
        result.Role.Should().Be("Viewer");
        result.TenantId.Should().Be(_tenantId);
        result.Permissions.Should().Contain("dashboard.read");
    }

    [Fact]
    public async Task Handle_BasariliKayit_UserRepositoryInsertCagrilmali()
    {
        // Arrange
        var viewerRole = new OperationClaim { Id = Guid.NewGuid(), Name = "Viewer" };

        _userRepository.GetByEmailAsync("new@klcsystem.com", _tenantId).Returns((User?)null);
        _roleRepository.GetByNameAsync("Viewer", _tenantId).Returns(viewerRole);
        _roleRepository.GetPermissionsAsync(viewerRole.Id).Returns(Enumerable.Empty<string>());
        _userRepository.InsertAsync(Arg.Any<User>()).Returns(Guid.NewGuid());

        var command = new RegisterCommand("new@klcsystem.com", "Password123!", "Yeni", "Kullanici", _tenantId);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        await _userRepository.Received(1).InsertAsync(Arg.Is<User>(u =>
            u.Email == "new@klcsystem.com" &&
            u.FirstName == "Yeni" &&
            u.LastName == "Kullanici" &&
            u.TenantId == _tenantId &&
            u.IsActive &&
            u.RoleId == viewerRole.Id &&
            !string.IsNullOrEmpty(u.PasswordHash)));
    }

    [Fact]
    public async Task Handle_DuplicateEmail_InvalidOperationExceptionFirlatir()
    {
        // Arrange
        var existingUser = new User { Email = "existing@klcsystem.com" };
        _userRepository.GetByEmailAsync("existing@klcsystem.com", _tenantId).Returns(existingUser);

        var command = new RegisterCommand("existing@klcsystem.com", "Password123!", "Test", "User", _tenantId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Bu e-posta adresi zaten kullanılmaktadır.");
    }

    [Fact]
    public async Task Handle_VarsayilanRolBulunamaz_InvalidOperationExceptionFirlatir()
    {
        // Arrange
        _userRepository.GetByEmailAsync("new@klcsystem.com", _tenantId).Returns((User?)null);
        _roleRepository.GetByNameAsync("Viewer", _tenantId).Returns((OperationClaim?)null);

        var command = new RegisterCommand("new@klcsystem.com", "Password123!", "Yeni", "Kullanici", _tenantId);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Varsayılan rol bulunamadı.");
    }

    [Fact]
    public async Task Handle_BasariliKayit_SifreHashlenmeli()
    {
        // Arrange
        var viewerRole = new OperationClaim { Id = Guid.NewGuid(), Name = "Viewer" };

        _userRepository.GetByEmailAsync("new@klcsystem.com", _tenantId).Returns((User?)null);
        _roleRepository.GetByNameAsync("Viewer", _tenantId).Returns(viewerRole);
        _roleRepository.GetPermissionsAsync(viewerRole.Id).Returns(Enumerable.Empty<string>());

        User? capturedUser = null;
        _userRepository.InsertAsync(Arg.Do<User>(u => capturedUser = u)).Returns(Guid.NewGuid());

        var command = new RegisterCommand("new@klcsystem.com", "Password123!", "Yeni", "Kullanici", _tenantId);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.PasswordHash.Should().NotBe("Password123!");
        BCrypt.Net.BCrypt.Verify("Password123!", capturedUser.PasswordHash).Should().BeTrue();
    }
}
