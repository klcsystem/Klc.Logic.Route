-- ============================================================================
-- 018_FeedbackSchema.sql
-- Musteri Bildirimleri (Notification Templates) ve Teslimat Geri Bildirimi
-- ============================================================================

-- Notification Templates — bildirim sablonlari (SMS, Email, Push)
CREATE TABLE IF NOT EXISTS logistics.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    name VARCHAR(200) NOT NULL,
    channel INT NOT NULL DEFAULT 0,             -- 0=SMS, 1=Email, 2=Push
    stage INT NOT NULL DEFAULT 0,               -- 0=OrderConfirmed, 1=OutForDelivery, 2=Approaching, 3=Delivered, 4=FailedAttempt
    subject VARCHAR(500) NOT NULL DEFAULT '',
    template_body TEXT NOT NULL DEFAULT '',
    variables VARCHAR(500) NOT NULL DEFAULT '',  -- comma-separated variable names
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_tenant ON logistics.notification_templates(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_stage ON logistics.notification_templates(tenant_id, stage, channel) WHERE is_deleted = FALSE;

-- Delivery Feedback — teslimat geri bildirimi
CREATE TABLE IF NOT EXISTS logistics.delivery_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID,
    order_id UUID,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    feedback_type INT NOT NULL DEFAULT 0,       -- 0=Delivery, 1=Product, 2=Driver
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_name VARCHAR(200),
    customer_phone VARCHAR(50),
    driver_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_delivery_feedback_tenant ON logistics.delivery_feedback(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_delivery_feedback_shipment ON logistics.delivery_feedback(shipment_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_delivery_feedback_driver ON logistics.delivery_feedback(driver_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_delivery_feedback_rating ON logistics.delivery_feedback(tenant_id, rating) WHERE is_deleted = FALSE;
