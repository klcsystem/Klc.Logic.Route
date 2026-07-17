namespace Klc.LogicRoute.Domain.Entities;

/// <summary>
/// Broker portalı için zenginleştirilmiş teklif görünümü — sigorta talebi (quote) +
/// ilgili sevkiyat detayları (rota, kargo). Broker riski değerlendirip fiyatlayabilsin diye.
/// insurance_quotes + shipments JOIN sonucu (read model).
/// </summary>
public class BrokerQuoteView
{
    public Guid Id { get; set; }               // quote id
    public Guid ShipmentId { get; set; }
    public Guid PartnerId { get; set; }
    public string? PartnerName { get; set; }
    public string? ShipmentNumber { get; set; }
    public decimal CargoValue { get; set; }
    public decimal RiskScore { get; set; }
    public decimal? PremiumAmount { get; set; }
    public string Currency { get; set; } = "TRY";
    public int Status { get; set; }            // 0=Pending,1=Quoted,2=Accepted...
    public DateTime? ValidUntil { get; set; }
    public string? QuotedByName { get; set; }
    public DateTime CreatedAt { get; set; }

    // Sevkiyattan
    public string? OriginCity { get; set; }
    public string? DestinationCity { get; set; }
    public string? OriginAddress { get; set; }
    public string? DestinationAddress { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? VolumeM3 { get; set; }
    public bool IsHazardous { get; set; }
    public bool RequiresColdChain { get; set; }
}
