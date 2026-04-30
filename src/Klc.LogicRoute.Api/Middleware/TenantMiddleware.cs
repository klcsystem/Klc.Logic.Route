namespace Klc.LogicRoute.Api.Middleware;

public class TenantMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        // Tenant resolution happens in TenantProvider via claims/headers
        await next(context);
    }
}
