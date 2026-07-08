namespace Klc.LogicRoute.Domain.Interfaces;

/// <summary>
/// Mekansal + zamansal trafik profili sağlayıcı. Bir konum + yerel saat için
/// süre çarpanı döner (>1 = yoğun/yavaş, ~1 = akıcı). Profil verisi yoksa null döner
/// ve çağıran taraf global (öğrenilen/hardcoded) çarpana düşer.
/// </summary>
public interface ITrafficProfileProvider
{
    /// <summary>
    /// Verilen konum ve yerel saatteki trafik süre çarpanı. Profil yoksa null.
    /// </summary>
    Task<double?> GetSpeedMultiplierAsync(double lat, double lng, DateTime localTime, CancellationToken cancellationToken = default);

    /// <summary>Yüklü profil satır sayısı (teşhis/istatistik için).</summary>
    Task<int> GetProfileCountAsync(CancellationToken cancellationToken = default);
}
