-- ============================================================================
-- 027_ColdChainSchema.sql
-- Cold Chain IoT Monitoring — temperature/humidity readings for shipments
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.temperature_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    sensor_id VARCHAR(100) NOT NULL,
    temperature NUMERIC(6,2) NOT NULL,
    humidity NUMERIC(6,2) NOT NULL DEFAULT 0,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    reading_at TIMESTAMPTZ NOT NULL,
    is_alarm BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_temperature_readings_shipment ON logistics.temperature_readings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_tenant ON logistics.temperature_readings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_alarm ON logistics.temperature_readings(tenant_id, is_alarm, reading_at DESC)
    WHERE is_alarm = TRUE;
CREATE INDEX IF NOT EXISTS idx_temperature_readings_reading_at ON logistics.temperature_readings(reading_at DESC);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_sensor ON logistics.temperature_readings(sensor_id);
