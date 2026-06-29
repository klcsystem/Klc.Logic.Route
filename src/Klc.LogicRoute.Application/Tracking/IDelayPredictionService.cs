using Klc.LogicRoute.Application.Tracking.Models;

namespace Klc.LogicRoute.Application.Tracking;

public interface IDelayPredictionService
{
    /// <summary>
    /// Checks all active shipments for predicted delays and returns warnings
    /// for any shipment where the predicted delay exceeds the threshold.
    /// </summary>
    Task<IReadOnlyList<DelayWarning>> CheckAllActiveShipmentsAsync();
}
