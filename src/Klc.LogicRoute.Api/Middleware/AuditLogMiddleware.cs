using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Api.Middleware;

public class AuditLogMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> AuditableMethods = ["POST", "PUT", "PATCH", "DELETE"];

    public async Task InvokeAsync(HttpContext context, IAuditLogRepository auditLogRepository, ITenantProvider tenantProvider)
    {
        if (!AuditableMethods.Contains(context.Request.Method))
        {
            await next(context);
            return;
        }

        await next(context);

        if (context.Response.StatusCode < 400)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    TenantId = tenantProvider.GetTenantId(),
                    UserId = tenantProvider.GetUserId(),
                    UserEmail = tenantProvider.GetUserName(),
                    Action = $"{context.Request.Method} {context.Request.Path}",
                    EntityType = ExtractEntityType(context.Request.Path),
                    IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = context.Request.Headers.UserAgent.ToString()
                };
                await auditLogRepository.InsertAsync(auditLog);
            }
            catch
            {
                // Audit logging should never break the request
            }
        }
    }

    private static string ExtractEntityType(PathString path)
    {
        var segments = path.Value?.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments?.Length >= 2 ? segments[1] : "unknown";
    }
}
