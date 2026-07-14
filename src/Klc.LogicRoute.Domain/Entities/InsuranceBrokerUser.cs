using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

/// <summary>
/// Sigorta broker portalı kullanıcısı (ör. Kronos çalışanı). Her broker kendi
/// e-posta/şifresiyle giriş yapar; verdiği teklifler ona atfedilir (hesap verebilirlik).
/// </summary>
public class InsuranceBrokerUser : BaseEntity
{
    public Guid PartnerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
}
