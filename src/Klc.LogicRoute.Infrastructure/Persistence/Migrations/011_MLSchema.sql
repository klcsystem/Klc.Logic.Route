-- ============================================================================
-- 011_MLSchema.sql
-- Faz 4: ML Model Metadata, Prediction Logging
-- ============================================================================

-- ML model metadata
CREATE TABLE IF NOT EXISTS logistics.ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- DeliveryTime, DelayRisk, CostAnomaly
    model_version VARCHAR(50) NOT NULL,
    file_path TEXT,
    metrics JSONB,
    training_records INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_ml_models_type_active ON logistics.ml_models(model_type, is_active);

-- Prediction log
CREATE TABLE IF NOT EXISTS logistics.prediction_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    model_id UUID REFERENCES logistics.ml_models(id),
    model_type VARCHAR(50) NOT NULL,
    input_features JSONB,
    predicted_value DOUBLE PRECISION NOT NULL DEFAULT 0,
    actual_value DOUBLE PRECISION,
    prediction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_prediction_log_type ON logistics.prediction_log(model_type, prediction_at DESC);

-- ML training data view (aggregated shipment data for training)
CREATE OR REPLACE VIEW logistics.ml_training_data AS
SELECT
    s.id AS shipment_id,
    s.tenant_id,
    s.origin_city,
    s.destination_city,
    s.chargeable_weight AS weight,
    s.total_volume_m3 AS volume,
    s.selected_provider_id AS provider_id,
    EXTRACT(DOW FROM s.requested_pickup_date) AS day_of_week,
    EXTRACT(HOUR FROM s.requested_pickup_date) AS hour,
    s.is_hazardous,
    s.requires_cold_chain,
    s.pallet_count,
    s.priority,
    s.calculated_price,
    EXTRACT(EPOCH FROM (s.actual_delivery_date - s.actual_pickup_date)) / 3600.0 AS delivery_hours,
    CASE WHEN s.actual_delivery_date > s.requested_delivery_date THEN TRUE ELSE FALSE END AS is_delayed
FROM logistics.shipments s
WHERE s.status >= 8 -- Delivered or Completed
  AND s.actual_pickup_date IS NOT NULL
  AND s.actual_delivery_date IS NOT NULL
  AND s.is_deleted = FALSE;
