using FluentAssertions;
using Klc.LogicRoute.Application.Auth.Commands;

namespace Klc.LogicRoute.Application.Tests.Auth;

public class RegisterCommandValidatorTests
{
    private readonly RegisterCommandValidator _validator;
    private readonly Guid _tenantId = Guid.NewGuid();

    public RegisterCommandValidatorTests()
    {
        _validator = new RegisterCommandValidator();
    }

    [Fact]
    public async Task Validate_GecerliKomut_HataYok()
    {
        // Arrange
        var command = new RegisterCommand("new@klcsystem.com", "Password123!", "Yeni", "Kullanici", _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Validate_BosEmail_ValidationHatasi(string? email)
    {
        // Arrange
        var command = new RegisterCommand(email!, "Password123!", "Yeni", "Kullanici", _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    [Fact]
    public async Task Validate_GecersizEmail_ValidationHatasi()
    {
        // Arrange
        var command = new RegisterCommand("invalid-email", "Password123!", "Yeni", "Kullanici", _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Validate_KisaSifre_ValidationHatasi()
    {
        // Arrange
        var command = new RegisterCommand("new@klcsystem.com", "12345", "Yeni", "Kullanici", _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Password");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Validate_BosFirstName_ValidationHatasi(string? firstName)
    {
        // Arrange
        var command = new RegisterCommand("new@klcsystem.com", "Password123!", firstName!, "Kullanici", _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "FirstName");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Validate_BosLastName_ValidationHatasi(string? lastName)
    {
        // Arrange
        var command = new RegisterCommand("new@klcsystem.com", "Password123!", "Yeni", lastName!, _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "LastName");
    }

    [Fact]
    public async Task Validate_BosTenantId_ValidationHatasi()
    {
        // Arrange
        var command = new RegisterCommand("new@klcsystem.com", "Password123!", "Yeni", "Kullanici", Guid.Empty);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "TenantId");
    }

    [Fact]
    public async Task Validate_FirstNameCokUzun_ValidationHatasi()
    {
        // Arrange
        var longName = new string('a', 101);
        var command = new RegisterCommand("new@klcsystem.com", "Password123!", longName, "Kullanici", _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "FirstName");
    }

    [Fact]
    public async Task Validate_LastNameCokUzun_ValidationHatasi()
    {
        // Arrange
        var longName = new string('a', 101);
        var command = new RegisterCommand("new@klcsystem.com", "Password123!", "Yeni", longName, _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "LastName");
    }
}
