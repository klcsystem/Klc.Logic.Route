using Klc.LogicRoute.Application.Auth.Dtos;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using MediatR;

namespace Klc.LogicRoute.Application.Auth.Commands;

public class RegisterHandler(IUserRepository userRepository, IRoleRepository roleRepository) : IRequestHandler<RegisterCommand, AuthResponseDto?>
{
    public async Task<AuthResponseDto?> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var existing = await userRepository.GetByEmailAsync(request.Email, request.TenantId);
        if (existing != null)
            throw new InvalidOperationException("Bu e-posta adresi zaten kullanilmaktadir.");

        var viewerRole = await roleRepository.GetByNameAsync("Viewer", request.TenantId);
        if (viewerRole == null)
            throw new InvalidOperationException("Varsayilan rol bulunamadi.");

        var user = new User
        {
            TenantId = request.TenantId,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsActive = true,
            RoleId = viewerRole.Id
        };

        await userRepository.InsertAsync(user);

        var permissions = await roleRepository.GetPermissionsAsync(viewerRole.Id);

        return new AuthResponseDto(
            Token: "",
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Role: viewerRole.Name,
            UserId: user.Id,
            TenantId: user.TenantId,
            Permissions: permissions);
    }
}
