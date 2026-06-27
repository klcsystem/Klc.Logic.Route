namespace Klc.LogicRoute.Domain.Enums;

public enum DeliveryNotificationStage
{
    OrderConfirmed = 0,
    OutForDelivery = 1,
    Approaching = 2,
    Delivered = 3,
    FailedAttempt = 4
}
