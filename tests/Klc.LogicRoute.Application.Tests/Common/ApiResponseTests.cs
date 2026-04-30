using FluentAssertions;
using Klc.LogicRoute.Application.Common.Models;

namespace Klc.LogicRoute.Application.Tests.Common;

public class ApiResponseTests
{
    [Fact]
    public void Ok_BasariliResponse_SuccessTrueOlmali()
    {
        // Act
        var response = ApiResponse<string>.Ok("test-data");

        // Assert
        response.Success.Should().BeTrue();
        response.Data.Should().Be("test-data");
        response.Errors.Should().BeNull();
    }

    [Fact]
    public void Ok_MesajIle_MesajAtanmali()
    {
        // Act
        var response = ApiResponse<string>.Ok("test-data", "Islem basarili");

        // Assert
        response.Success.Should().BeTrue();
        response.Data.Should().Be("test-data");
        response.Message.Should().Be("Islem basarili");
    }

    [Fact]
    public void Fail_HataliResponse_SuccessFalseOlmali()
    {
        // Act
        var response = ApiResponse<string>.Fail("Bir hata olustu");

        // Assert
        response.Success.Should().BeFalse();
        response.Data.Should().BeNull();
        response.Message.Should().Be("Bir hata olustu");
    }

    [Fact]
    public void Fail_HataListesiIle_ErrorsIcermeli()
    {
        // Arrange
        var errors = new List<string> { "Hata 1", "Hata 2" };

        // Act
        var response = ApiResponse<string>.Fail("Dogrulama hatasi", errors);

        // Assert
        response.Success.Should().BeFalse();
        response.Errors.Should().HaveCount(2);
        response.Errors.Should().Contain("Hata 1");
        response.Errors.Should().Contain("Hata 2");
    }
}
