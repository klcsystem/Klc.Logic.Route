using Klc.LogicRoute.Application.Common.Interfaces;

namespace Klc.LogicRoute.Api.Services;

public class TenantProvider(IHttpContextAccessor httpContextAccessor) : ITenantProvider
{
    public Guid GetTenantId()
    {
        var context = httpContextAccessor.HttpContext;

        // Try header first (API key based)
        var tenantHeader = context?.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (!string.IsNullOrEmpty(tenantHeader) && Guid.TryParse(tenantHeader, out var headerTenantId))
            return headerTenantId;

        // Try JWT claim
        var tenantClaim = context?.User.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var claimTenantId))
            return claimTenantId;

        // Default tenant for development
        return Guid.Parse("00000000-0000-0000-0000-000000000001");
    }

    public string? GetUserId()
    {
        return httpContextAccessor.HttpContext?.User.FindFirst("sub")?.Value
            ?? httpContextAccessor.HttpContext?.Request.Headers["X-User-Id"].FirstOrDefault();
    }

    public string? GetUserName()
    {
        return httpContextAccessor.HttpContext?.User.FindFirst("name")?.Value
            ?? httpContextAccessor.HttpContext?.Request.Headers["X-User-Name"].FirstOrDefault()
            ?? "system";
    }

    public string? GetUserRole()
    {
        return httpContextAccessor.HttpContext?.User.FindFirst("role")?.Value
            ?? httpContextAccessor.HttpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
            ?? httpContextAccessor.HttpContext?.Request.Headers["X-User-Role"].FirstOrDefault();
    }
}
