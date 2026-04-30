using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class Recommendation : BaseEntity
{
    public Guid ShipmentId { get; set; }
    public Guid SelectedProviderId { get; set; }
    public Guid SelectedContractRateId { get; set; }
    public string? SelectedProviderName { get; set; }
    public decimal CalculatedPrice { get; set; }

    // Alternatifler
    public decimal? AlternativePrice1 { get; set; }
    public Guid? AlternativeProviderId1 { get; set; }
    public string? AlternativeProviderName1 { get; set; }
    public decimal? AlternativePrice2 { get; set; }
    public Guid? AlternativeProviderId2 { get; set; }
    public string? AlternativeProviderName2 { get; set; }

    // Tasarruf
    public decimal SavingsAmount { get; set; }
    public decimal SavingsPercent { get; set; }

    // Scoring
    public RecommendationReason Reason { get; set; }
    public decimal ScorePrice { get; set; }
    public decimal ScoreSpeed { get; set; }
    public decimal ScoreReliability { get; set; }
    public decimal OverallScore { get; set; }
    public VehicleCategory RecommendedVehicle { get; set; }
    public string? Currency { get; set; } = "TRY";
    public string? Explanation { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
