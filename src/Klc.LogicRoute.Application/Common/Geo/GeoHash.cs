namespace Klc.LogicRoute.Application.Common.Geo;

/// <summary>
/// Standard geohash encoder. İBB'nin "hourly traffic density" veri seti geohash
/// precision-6 kullanır (ör. "sxkfph" ~1.2km hücre), bu yüzden aynı precision ile
/// encode edince İBB hücreleriyle birebir eşleşir.
/// </summary>
public static class GeoHash
{
    private const string Base32 = "0123456789bcdefghjkmnpqrstuvwxyz";

    public static string Encode(double latitude, double longitude, int precision = 6)
    {
        double latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
        var geohash = new System.Text.StringBuilder(precision);
        var even = true;
        var bit = 0;
        var ch = 0;

        while (geohash.Length < precision)
        {
            if (even)
            {
                var mid = (lngMin + lngMax) / 2;
                if (longitude >= mid) { ch |= 1 << (4 - bit); lngMin = mid; }
                else lngMax = mid;
            }
            else
            {
                var mid = (latMin + latMax) / 2;
                if (latitude >= mid) { ch |= 1 << (4 - bit); latMin = mid; }
                else latMax = mid;
            }

            even = !even;
            if (bit < 4)
            {
                bit++;
            }
            else
            {
                geohash.Append(Base32[ch]);
                bit = 0;
                ch = 0;
            }
        }

        return geohash.ToString();
    }

    /// <summary>Haftalık saat indeksi (0-167): Pazar 00:00 = 0. Yerel saat verilmeli.</summary>
    public static int HourOfWeek(DateTime localTime) => (int)localTime.DayOfWeek * 24 + localTime.Hour;
}
