using Klc.LogicRoute.Application.Common.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Services;

public class CurrentUserService(ITenantProvider tenantProvider) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var id = tenantProvider.GetUserId();
            return Guid.TryParse(id, out var uid) ? uid : null;
        }
    }

    public string? Email => null;
    public string? Role => tenantProvider.GetUserRole();
    public Guid TenantId => tenantProvider.GetTenantId();
}
