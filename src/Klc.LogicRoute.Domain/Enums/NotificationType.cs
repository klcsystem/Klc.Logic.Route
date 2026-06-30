namespace Klc.LogicRoute.Domain.Enums;

public enum NotificationType
{
    Info = 0,
    Warning = 1,
    Error = 2,
    Success = 3,
    OrderCreated = 10,
    OrderStatusChanged = 11,
    ShipmentCreated = 20,
    ShipmentDelivered = 21,
    ShipmentDelayed = 22,
    ContractExpiring = 30,
    PerformanceAlert = 40,
    GeofenceArrived = 50,
    GeofenceDeparted = 51,
    RouteDeviation = 60,
    DelayWarning = 70,
    DelayHigh = 71,
    DelayCritical = 72,
    DeliverySlotChange = 80,
    DeliveryPointChangeRequest = 81,
    DriverMessage = 90
}
