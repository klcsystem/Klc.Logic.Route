using Klc.LogicRoute.Application.Auth.Dtos;
using MediatR;

namespace Klc.LogicRoute.Application.Auth.Queries;

public record GetCurrentUserQuery(Guid UserId, Guid TenantId) : IRequest<CurrentUserDto?>;
