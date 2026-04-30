using Klc.LogicRoute.Application.Auth.Commands;
using Klc.LogicRoute.Application.Auth.Dtos;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Interfaces;
using Klc.LogicRoute.Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    IMediator mediator,
    IJwtTokenService jwtTokenService,
    ITenantProvider tenantProvider,
    IUserRepository userRepository,
    IRoleRepository roleRepository) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await mediator.Send(new LoginCommand(request.Email, request.Password, tenantId));

        if (result == null)
            return Unauthorized(ApiResponse<LoginResponse>.Fail("Invalid email or password"));

        var user = await userRepository.GetByEmailAsync(request.Email, tenantId);
        var permissions = await roleRepository.GetPermissionsAsync(user!.RoleId);
        var token = jwtTokenService.GenerateToken(user, permissions);

        var response = result with { Token = token };
        return Ok(ApiResponse<LoginResponse>.Ok(response));
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var result = await mediator.Send(new RegisterCommand(request.Email, request.Password, request.FirstName, request.LastName, tenantId));

        if (result == null)
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("Registration failed"));

        var user = await userRepository.GetByEmailAsync(request.Email, tenantId);
        var permissions = await roleRepository.GetPermissionsAsync(user!.RoleId);
        var token = jwtTokenService.GenerateToken(user, permissions);

        var response = result with { Token = token };
        return CreatedAtAction(nameof(Register), ApiResponse<AuthResponseDto>.Ok(response));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<CurrentUserDto>>> GetCurrentUser()
    {
        var userId = tenantProvider.GetUserId();
        var tenantId = tenantProvider.GetTenantId();

        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var uid))
            return Unauthorized(ApiResponse<CurrentUserDto>.Fail("Not authenticated"));

        var user = await userRepository.GetByIdAsync(uid, tenantId);
        if (user == null)
            return NotFound(ApiResponse<CurrentUserDto>.Fail("User not found"));

        var permissions = await roleRepository.GetPermissionsAsync(user.RoleId);

        var dto = new CurrentUserDto(
            user.Id, user.Email, user.FirstName, user.LastName,
            user.Role?.Name ?? "", user.TenantId, permissions);

        return Ok(ApiResponse<CurrentUserDto>.Ok(dto));
    }

    [HttpPost("refresh")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> RefreshToken()
    {
        var userId = tenantProvider.GetUserId();
        var tenantId = tenantProvider.GetTenantId();

        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var uid))
            return Unauthorized(ApiResponse<LoginResponse>.Fail("Not authenticated"));

        var user = await userRepository.GetByIdAsync(uid, tenantId);
        if (user == null || !user.IsActive)
            return Unauthorized(ApiResponse<LoginResponse>.Fail("User not found or inactive"));

        var permissions = (await roleRepository.GetPermissionsAsync(user.RoleId)).ToList();
        var token = jwtTokenService.GenerateToken(user, permissions);

        var response = new LoginResponse(
            token, user.Email, user.FirstName, user.LastName,
            user.Role?.Name ?? "", user.Id, user.TenantId, permissions);

        return Ok(ApiResponse<LoginResponse>.Ok(response));
    }
}
