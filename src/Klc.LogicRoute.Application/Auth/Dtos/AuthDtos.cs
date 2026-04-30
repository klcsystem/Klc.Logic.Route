namespace Klc.LogicRoute.Application.Auth.Dtos;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(string Email, string Password, string FirstName, string LastName);

public record LoginResponse(
    string Token,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    Guid UserId,
    Guid TenantId,
    IEnumerable<string> Permissions);

public record AuthResponseDto(
    string Token,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    Guid UserId,
    Guid TenantId,
    IEnumerable<string> Permissions);

public record CurrentUserDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    Guid TenantId,
    IEnumerable<string> Permissions);
