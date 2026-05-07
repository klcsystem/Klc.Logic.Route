using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class MLModelMetadata : BaseEntity
{
    public string ModelType { get; set; } = string.Empty; // DeliveryTime, DelayRisk, CostAnomaly
    public string ModelVersion { get; set; } = "1.0";
    public string? FilePath { get; set; }
    public string? Metrics { get; set; } // JSON string
    public int TrainingRecords { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime TrainedAt { get; set; } = DateTime.UtcNow;
}
