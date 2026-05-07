using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class PredictionLog : BaseEntity
{
    public Guid? ModelId { get; set; }
    public string ModelType { get; set; } = string.Empty;
    public string? InputFeatures { get; set; } // JSON string
    public double PredictedValue { get; set; }
    public double? ActualValue { get; set; }
    public DateTime PredictionAt { get; set; } = DateTime.UtcNow;
}
