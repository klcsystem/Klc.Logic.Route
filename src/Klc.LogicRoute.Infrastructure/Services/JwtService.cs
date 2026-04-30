using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Klc.LogicRoute.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Klc.LogicRoute.Infrastructure.Services;

public interface IJwtTokenService
{
    string GenerateToken(User user, IEnumerable<string> permissions);
}

public class JwtTokenService(IConfiguration configuration) : IJwtTokenService
{
    public string GenerateToken(User user, IEnumerable<string> permissions)
    {
        var jwtSettings = configuration.GetSection("Jwt");
        var secret = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
        var issuer = jwtSettings["Issuer"] ?? "LogicRoute";
        var audience = jwtSettings["Audience"] ?? "LogicRoute";
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new("sub", user.Id.ToString()),
            new("email", user.Email),
            new("name", $"{user.FirstName} {user.LastName}"),
            new("first_name", user.FirstName),
            new("last_name", user.LastName),
            new("tenant_id", user.TenantId.ToString()),
            new("role", user.Role?.Name ?? ""),
            new("role_id", user.RoleId.ToString()),
        };

        foreach (var permission in permissions)
            claims.Add(new Claim("permission", permission));

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
