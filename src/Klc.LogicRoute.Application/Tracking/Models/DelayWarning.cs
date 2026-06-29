namespace Klc.LogicRoute.Application.Tracking.Models;

public record DelayWarning(
    Guid ShipmentId,
    Guid TenantId,
    string ShipmentNumber,
    string Severity, // WARNING, HIGH, CRITICAL
    int PredictedDelayMinutes,
    DateTime PlannedArrival,
    DateTime PredictedArrival,
    string? DriverName,
    string? DestinationCity,
    string SuggestedAction,
    DateTime DetectedAt);
