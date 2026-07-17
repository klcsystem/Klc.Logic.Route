namespace Klc.LogicRoute.Application.RoutingRules;

/// <summary>
/// Türkiye şehir → coğrafi bölge eşlemesi. Kurallar bölge bazlı (Marmara, İç Anadolu…),
/// siparişler ise şehir bazlı (Bursa, Ankara…) tutuluyordu; kural motoru bu yüzden hiç
/// eşleşmiyordu. Bu çözücü şehir adını bölgeye çevirerek eşleşmeyi mümkün kılar.
/// </summary>
public static class RegionResolver
{
    private static readonly Dictionary<string, string> CityRegion = new(StringComparer.OrdinalIgnoreCase)
    {
        // Marmara
        ["Istanbul"] = "Marmara", ["İstanbul"] = "Marmara", ["Bursa"] = "Marmara", ["Kocaeli"] = "Marmara",
        ["Tekirdag"] = "Marmara", ["Tekirdağ"] = "Marmara", ["Balikesir"] = "Marmara", ["Balıkesir"] = "Marmara",
        ["Sakarya"] = "Marmara", ["Canakkale"] = "Marmara", ["Çanakkale"] = "Marmara", ["Edirne"] = "Marmara",
        ["Kirklareli"] = "Marmara", ["Yalova"] = "Marmara", ["Bilecik"] = "Marmara",
        // Ege
        ["Izmir"] = "Ege", ["İzmir"] = "Ege", ["Manisa"] = "Ege", ["Aydin"] = "Ege", ["Aydın"] = "Ege",
        ["Denizli"] = "Ege", ["Mugla"] = "Ege", ["Muğla"] = "Ege", ["Afyonkarahisar"] = "Ege", ["Afyon"] = "Ege",
        ["Kutahya"] = "Ege", ["Kütahya"] = "Ege", ["Usak"] = "Ege", ["Uşak"] = "Ege",
        // Ic Anadolu
        ["Ankara"] = "Ic Anadolu", ["Konya"] = "Ic Anadolu", ["Kayseri"] = "Ic Anadolu", ["Eskisehir"] = "Ic Anadolu",
        ["Eskişehir"] = "Ic Anadolu", ["Sivas"] = "Ic Anadolu", ["Yozgat"] = "Ic Anadolu", ["Aksaray"] = "Ic Anadolu",
        ["Nevsehir"] = "Ic Anadolu", ["Nevşehir"] = "Ic Anadolu", ["Nigde"] = "Ic Anadolu", ["Niğde"] = "Ic Anadolu",
        ["Kirikkale"] = "Ic Anadolu", ["Kırıkkale"] = "Ic Anadolu", ["Karaman"] = "Ic Anadolu", ["Corum"] = "Ic Anadolu", ["Çorum"] = "Ic Anadolu",
        // Akdeniz
        ["Antalya"] = "Akdeniz", ["Adana"] = "Akdeniz", ["Mersin"] = "Akdeniz", ["Hatay"] = "Akdeniz",
        ["Isparta"] = "Akdeniz", ["Burdur"] = "Akdeniz", ["Osmaniye"] = "Akdeniz", ["Kahramanmaras"] = "Akdeniz", ["Kahramanmaraş"] = "Akdeniz",
        // Karadeniz
        ["Samsun"] = "Karadeniz", ["Trabzon"] = "Karadeniz", ["Ordu"] = "Karadeniz", ["Rize"] = "Karadeniz",
        ["Zonguldak"] = "Karadeniz", ["Bolu"] = "Karadeniz", ["Duzce"] = "Karadeniz", ["Düzce"] = "Karadeniz",
        ["Kastamonu"] = "Karadeniz", ["Sinop"] = "Karadeniz", ["Amasya"] = "Karadeniz", ["Tokat"] = "Karadeniz",
        ["Giresun"] = "Karadeniz", ["Bartin"] = "Karadeniz", ["Bartın"] = "Karadeniz", ["Karabuk"] = "Karadeniz", ["Karabük"] = "Karadeniz",
        // Dogu Anadolu
        ["Erzurum"] = "Dogu Anadolu", ["Van"] = "Dogu Anadolu", ["Malatya"] = "Dogu Anadolu", ["Elazig"] = "Dogu Anadolu",
        ["Elazığ"] = "Dogu Anadolu", ["Agri"] = "Dogu Anadolu", ["Ağrı"] = "Dogu Anadolu", ["Kars"] = "Dogu Anadolu",
        ["Erzincan"] = "Dogu Anadolu", ["Mus"] = "Dogu Anadolu", ["Muş"] = "Dogu Anadolu", ["Bingol"] = "Dogu Anadolu", ["Bingöl"] = "Dogu Anadolu",
        // Guneydogu Anadolu
        ["Gaziantep"] = "Guneydogu Anadolu", ["Sanliurfa"] = "Guneydogu Anadolu", ["Şanlıurfa"] = "Guneydogu Anadolu",
        ["Diyarbakir"] = "Guneydogu Anadolu", ["Diyarbakır"] = "Guneydogu Anadolu", ["Mardin"] = "Guneydogu Anadolu",
        ["Batman"] = "Guneydogu Anadolu", ["Adiyaman"] = "Guneydogu Anadolu", ["Adıyaman"] = "Guneydogu Anadolu", ["Siirt"] = "Guneydogu Anadolu",
    };

    public static string? Resolve(string? city)
    {
        if (string.IsNullOrWhiteSpace(city)) return null;
        return CityRegion.TryGetValue(city.Trim(), out var region) ? region : null;
    }

    /// <summary>Kural değeri (bölge) sipariş şehriyle eşleşiyor mu — hem doğrudan şehir hem bölge eşleşmesini kabul eder.</summary>
    public static bool RegionMatches(string ruleRegion, string? orderCity)
    {
        if (string.IsNullOrEmpty(ruleRegion) || ruleRegion == "*") return true;
        if (string.IsNullOrWhiteSpace(orderCity)) return false;
        if (string.Equals(ruleRegion, orderCity, StringComparison.OrdinalIgnoreCase)) return true;
        return string.Equals(ruleRegion, Resolve(orderCity), StringComparison.OrdinalIgnoreCase);
    }
}
