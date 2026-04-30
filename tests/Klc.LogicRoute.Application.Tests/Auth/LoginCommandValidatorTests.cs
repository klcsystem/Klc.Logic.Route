using FluentAssertions;
using Klc.LogicRoute.Application.Auth.Commands;

namespace Klc.LogicRoute.Application.Tests.Auth;

public class LoginCommandValidatorTests
{
    private readonly LoginCommandValidator _validator;
    private readonly Guid _tenantId = Guid.NewGuid();

    public LoginCommandValidatorTests()
    {
        _validator = new LoginCommandValidator();
    }

    [Fact]
    public async Task Validate_GecerliKomut_HataYok()
    {
        // Arrange
        var command = new LoginCommand("test@klcsystem.com", "Password123!", _tenantId);

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
        var command = new LoginCommand(email!, "Password123!", _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    [Theory]
    [InlineData("invalid-email")]
    [InlineData("test@")]
    [InlineData("@domain.com")]
    public async Task Validate_GecersizEmailFormati_ValidationHatasi(string email)
    {
        // Arrange
        var command = new LoginCommand(email, "Password123!", _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Validate_BosSifre_ValidationHatasi(string? password)
    {
        // Arrange
        var command = new LoginCommand("test@klcsystem.com", password!, _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Password");
    }

    [Fact]
    public async Task Validate_KisaSifre_ValidationHatasi()
    {
        // Arrange
        var command = new LoginCommand("test@klcsystem.com", "12345", _tenantId);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Password");
    }

    [Fact]
    public async Task Validate_BosTenantId_ValidationHatasi()
    {
        // Arrange
        var command = new LoginCommand("test@klcsystem.com", "Password123!", Guid.Empty);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "TenantId");
    }

    [Fact]
    public async Task Validate_TumAlanlarBos_CokluValidationHatasi()
    {
        // Arrange
        var command = new LoginCommand("", "", Guid.Empty);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Count.Should().BeGreaterOrEqualTo(3);
    }
}
