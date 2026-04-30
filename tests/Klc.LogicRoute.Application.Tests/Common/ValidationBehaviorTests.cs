using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using NSubstitute;
using Klc.LogicRoute.Application.Common.Behaviors;

namespace Klc.LogicRoute.Application.Tests.Common;

public record TestBehaviorRequest(string Name) : IRequest<string>;

public class AlwaysValidValidator : AbstractValidator<TestBehaviorRequest>
{
    // No rules = always valid
}

public class AlwaysFailValidator : AbstractValidator<TestBehaviorRequest>
{
    private readonly string _errorMessage;

    public AlwaysFailValidator(string errorMessage = "Name zorunludur.")
    {
        _errorMessage = errorMessage;
        RuleFor(x => x.Name).Must(_ => false).WithMessage(_errorMessage);
    }
}

public class ValidationBehaviorTests
{
    [Fact]
    public async Task Handle_ValidatorYok_SonrakiHandleraCagrilir()
    {
        // Arrange
        var validators = Enumerable.Empty<IValidator<TestBehaviorRequest>>();
        var behavior = new ValidationBehavior<TestBehaviorRequest, string>(validators);
        var next = Substitute.For<RequestHandlerDelegate<string>>();
        next(Arg.Any<CancellationToken>()).Returns("success");

        var request = new TestBehaviorRequest("test");

        // Act
        var result = await behavior.Handle(request, next, CancellationToken.None);

        // Assert
        result.Should().Be("success");
    }

    [Fact]
    public async Task Handle_GecerliRequest_SonrakiHandleraCagrilir()
    {
        // Arrange
        var validators = new List<IValidator<TestBehaviorRequest>> { new AlwaysValidValidator() };
        var behavior = new ValidationBehavior<TestBehaviorRequest, string>(validators);
        var next = Substitute.For<RequestHandlerDelegate<string>>();
        next(Arg.Any<CancellationToken>()).Returns("success");

        var request = new TestBehaviorRequest("test");

        // Act
        var result = await behavior.Handle(request, next, CancellationToken.None);

        // Assert
        result.Should().Be("success");
    }

    [Fact]
    public async Task Handle_GecersizRequest_InvalidOperationExceptionFirlatir()
    {
        // Arrange
        var validators = new List<IValidator<TestBehaviorRequest>> { new AlwaysFailValidator("Name zorunludur.") };
        var behavior = new ValidationBehavior<TestBehaviorRequest, string>(validators);
        var next = Substitute.For<RequestHandlerDelegate<string>>();

        var request = new TestBehaviorRequest("");

        // Act
        var act = () => behavior.Handle(request, next, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Name zorunludur.*");
    }

    [Fact]
    public async Task Handle_CokluValidator_TumHatalarBirlestir()
    {
        // Arrange
        var validators = new List<IValidator<TestBehaviorRequest>>
        {
            new AlwaysFailValidator("Hata 1"),
            new AlwaysFailValidator("Hata 2")
        };
        var behavior = new ValidationBehavior<TestBehaviorRequest, string>(validators);
        var next = Substitute.For<RequestHandlerDelegate<string>>();

        var request = new TestBehaviorRequest("");

        // Act
        var act = () => behavior.Handle(request, next, CancellationToken.None);

        // Assert
        var ex = await act.Should().ThrowAsync<InvalidOperationException>();
        ex.Which.Message.Should().Contain("Hata 1");
        ex.Which.Message.Should().Contain("Hata 2");
    }

    [Fact]
    public async Task Handle_GecersizRequest_NextCagrilmamali()
    {
        // Arrange
        var validators = new List<IValidator<TestBehaviorRequest>> { new AlwaysFailValidator() };
        var behavior = new ValidationBehavior<TestBehaviorRequest, string>(validators);
        var next = Substitute.For<RequestHandlerDelegate<string>>();

        var request = new TestBehaviorRequest("");

        // Act
        try { await behavior.Handle(request, next, CancellationToken.None); } catch { }

        // Assert
        await next.DidNotReceive()(Arg.Any<CancellationToken>());
    }
}
