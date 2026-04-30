namespace Klc.LogicRoute.Application.Common.Interfaces;

public interface ITenantProvider
{
    Guid GetTenantId();
    string? GetUserId();
    string? GetUserName();
    string? GetUserRole();
}
