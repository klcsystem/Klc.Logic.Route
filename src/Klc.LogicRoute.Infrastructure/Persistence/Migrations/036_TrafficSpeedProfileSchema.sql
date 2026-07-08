-- ============================================================================
-- 036_TrafficSpeedProfileSchema.sql
-- Mekansal + zamansal trafik hiz profili (Faz 1: Ibb acik veri + kendi ogrenme).
-- geohash6 hucre x haftalik-saat -> ortalama hiz + serbest-akis referansi.
-- Sehir geneli PAYLASILAN referans veri (tenant'a bagli DEGIL).
-- SADECE idempotent CREATE TABLE IF NOT EXISTS + index. SEED/DROP/ALTER YOK.
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.traffic_speed_profiles (
    geohash       VARCHAR(12)  NOT NULL,   -- geohash precision-6 (Ibb ile ayni)
    hour_of_week  SMALLINT     NOT NULL,   -- 0-167 (Pazar 00:00 = 0)
    avg_speed_kmh REAL         NOT NULL,   -- o hucre/saatteki gozlemlenen ort. hiz
    free_flow_kmh REAL         NOT NULL,   -- hucrenin serbest-akis referansi (yuksek persentil)
    sample_count  INTEGER      NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (geohash, hour_of_week)
);

CREATE INDEX IF NOT EXISTS idx_traffic_profiles_geohash
    ON logistics.traffic_speed_profiles(geohash);
