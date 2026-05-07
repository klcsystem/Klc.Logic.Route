-- ============================================================================
-- 008_CustomerEtaSchema.sql
-- Faz 1: Customer Tracking & ETA Notification
-- ============================================================================

-- Customer tracking records
CREATE TABLE IF NOT EXISTS logistics.customer_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id),
    tracking_token VARCHAR(64) NOT NULL UNIQUE,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    estimated_arrival TIMESTAMPTZ,
    last_eta_update TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_customer_tracking_token ON logistics.customer_tracking(tracking_token);
CREATE INDEX IF NOT EXISTS idx_customer_tracking_shipment ON logistics.customer_tracking(shipment_id, tenant_id);

-- ETA notification log
CREATE TABLE IF NOT EXISTS logistics.eta_notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id),
    customer_tracking_id UUID REFERENCES logistics.customer_tracking(id),
    channel VARCHAR(20) NOT NULL, -- 'sms' or 'email'
    recipient VARCHAR(255),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add customer fields to shipments (if not exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='logistics' AND table_name='shipments' AND column_name='customer_phone') THEN
        ALTER TABLE logistics.shipments ADD COLUMN customer_phone VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='logistics' AND table_name='shipments' AND column_name='customer_email') THEN
        ALTER TABLE logistics.shipments ADD COLUMN customer_email VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='logistics' AND table_name='shipments' AND column_name='customer_name') THEN
        ALTER TABLE logistics.shipments ADD COLUMN customer_name VARCHAR(200);
    END IF;
END $$;
