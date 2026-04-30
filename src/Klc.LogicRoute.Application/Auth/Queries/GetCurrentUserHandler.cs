using Klc.LogicRoute.Application.Auth.Dtos;
using Klc.LogicRoute.Domain.Interfaces;
using MediatR;

namespace Klc.LogicRoute.Application.Auth.Queries;

public class GetCurrentUserHandler(IUserRepository userRepository, IRoleRepository roleRepository)
    : IRequestHandler<GetCurrentUserQuery, CurrentUserDto?>
{
    public async Task<CurrentUserDto?> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(request.UserId, request.TenantId);
        if (user == null) return null;

        var permissions = await roleRepository.GetPermissionsAsync(user.RoleId);

        return new CurrentUserDto(
            user.Id, user.Email, user.FirstName, user.LastName,
            user.Role?.Name ?? "", user.TenantId, permissions);
    }
}
