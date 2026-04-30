using Klc.LogicRoute.Application.Auth.Dtos;
using Klc.LogicRoute.Domain.Interfaces;
using MediatR;

namespace Klc.LogicRoute.Application.Auth.Commands;

public class LoginHandler(IUserRepository userRepository, IRoleRepository roleRepository) : IRequestHandler<LoginCommand, LoginResponse?>
{
    public async Task<LoginResponse?> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByEmailAsync(request.Email, request.TenantId);
        if (user == null || !user.IsActive || string.IsNullOrEmpty(user.PasswordHash))
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        await userRepository.UpdateLastLoginAsync(user.Id, user.TenantId);

        var permissions = await roleRepository.GetPermissionsAsync(user.RoleId);
        var permList = permissions.ToList();

        return new LoginResponse(
            Token: "",
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Role: user.Role?.Name ?? "",
            UserId: user.Id,
            TenantId: user.TenantId,
            Permissions: permList);
    }
}
