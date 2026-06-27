using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Application.Notifications;

public interface ICustomerNotificationService
{
    Task SendDeliveryNotificationAsync(Guid tenantId, DeliveryNotificationStage stage,
        Dictionary<string, string> variables, string? phoneNumber = null, string? email = null,
        CancellationToken cancellationToken = default);
}
