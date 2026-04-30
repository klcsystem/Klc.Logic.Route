using Klc.LogicRoute.Application.Auth.Dtos;
using MediatR;

namespace Klc.LogicRoute.Application.Auth.Commands;

public record RegisterCommand(string Email, string Password, string FirstName, string LastName, Guid TenantId) : IRequest<AuthResponseDto?>;
