using FluentAssertions;
using NSubstitute;
using Klc.LogicRoute.Application.Auth.Commands;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.Tests.Auth;

public class LoginHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly LoginHandler _handler;
    private readonly Guid _tenantId = Guid.NewGuid();

    public LoginHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _roleRepository = Substitute.For<IRoleRepository>();
        _handler = new LoginHandler(_userRepository, _roleRepository);
    }

    private User CreateTestUser(string email = "test@klcsystem.com", bool isActive = true)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            FirstName = "Test",
            LastName = "User",
            IsActive = isActive,
            RoleId = Guid.NewGuid(),
            Role = new OperationClaim { Name = "Admin" }
        };
    }

    [Fact]
    public async Task Handle_BasariliLogin_LoginResponseDoner()
    {
        // Arrange
        var user = CreateTestUser();
        _userRepository.GetByEmailAsync("test@klcsystem.com", _tenantId).Returns(user);
        _roleRepository.GetPermissionsAsync(user.RoleId).Returns(new List<string> { "users.read", "orders.write" });

        var command = new LoginCommand("test@klcsystem.com", "Password123!", _tenantId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be("test@klcsystem.com");
        result.FirstName.Should().Be("Test");
        result.LastName.Should().Be("User");
        result.Role.Should().Be("Admin");
        result.UserId.Should().Be(user.Id);
        result.TenantId.Should().Be(_tenantId);
        result.Permissions.Should().Contain("users.read");
        result.Permissions.Should().Contain("orders.write");
    }

    [Fact]
    public async Task Handle_BasariliLogin_LastLoginAtGuncellenir()
    {
        // Arrange
        var user = CreateTestUser();
        _userRepository.GetByEmailAsync("test@klcsystem.com", _tenantId).Returns(user);
        _roleRepository.GetPermissionsAsync(user.RoleId).Returns(new List<string>());

        var command = new LoginCommand("test@klcsystem.com", "Password123!", _tenantId);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        await _userRepository.Received(1).UpdateLastLoginAsync(user.Id, _tenantId);
    }

    [Fact]
    public async Task Handle_YanlisSifre_NullDoner()
    {
        // Arrange
        var user = CreateTestUser();
        _userRepository.GetByEmailAsync("test@klcsystem.com", _tenantId).Returns(user);

        var command = new LoginCommand("test@klcsystem.com", "WrongPassword!", _tenantId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_OlmayanKullanici_NullDoner()
    {
        // Arrange
        _userRepository.GetByEmailAsync("nonexistent@klcsystem.com", _tenantId).Returns((User?)null);

        var command = new LoginCommand("nonexistent@klcsystem.com", "Password123!", _tenantId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_DeaktifKullanici_NullDoner()
    {
        // Arrange
        var user = CreateTestUser(isActive: false);
        _userRepository.GetByEmailAsync("test@klcsystem.com", _tenantId).Returns(user);

        var command = new LoginCommand("test@klcsystem.com", "Password123!", _tenantId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_PasswordHashNull_NullDoner()
    {
        // Arrange
        var user = CreateTestUser();
        user.PasswordHash = null;
        _userRepository.GetByEmailAsync("test@klcsystem.com", _tenantId).Returns(user);

        var command = new LoginCommand("test@klcsystem.com", "Password123!", _tenantId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_PasswordHashBos_NullDoner()
    {
        // Arrange
        var user = CreateTestUser();
        user.PasswordHash = "";
        _userRepository.GetByEmailAsync("test@klcsystem.com", _tenantId).Returns(user);

        var command = new LoginCommand("test@klcsystem.com", "Password123!", _tenantId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_YanlisSifre_LastLoginGuncellenmemeli()
    {
        // Arrange
        var user = CreateTestUser();
        _userRepository.GetByEmailAsync("test@klcsystem.com", _tenantId).Returns(user);

        var command = new LoginCommand("test@klcsystem.com", "WrongPassword!", _tenantId);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        await _userRepository.DidNotReceive().UpdateLastLoginAsync(Arg.Any<Guid>(), Arg.Any<Guid>());
    }
}
