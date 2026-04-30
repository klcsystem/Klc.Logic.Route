using Klc.LogicRoute.Application.Auth.Dtos;
using MediatR;

namespace Klc.LogicRoute.Application.Auth.Commands;

public record LoginCommand(string Email, string Password, Guid TenantId) : IRequest<LoginResponse?>;
