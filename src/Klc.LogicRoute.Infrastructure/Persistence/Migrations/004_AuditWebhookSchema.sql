-- ============================================================================
-- 004_AuditWebhookSchema.sql
-- Faz 4: Audit Logs, Webhook Events, Invoice Audits, Routing Rules
-- ============================================================================

-- Audit Logs
CREATE TABLE IF NOT EXISTS logistics.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    user_id VARCHAR(100),
    user_email VARCHAR(256),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON logistics.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON logistics.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON logistics.audit_logs(tenant_id, user_id);

-- Webhook Events
CREATE TABLE IF NOT EXISTS logistics.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    provider_code VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100),
    payload TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Received',
    processing_notes TEXT,
    processed_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant ON logistics.webhook_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_tracking ON logistics.webhook_events(tracking_number);

-- Invoice Audits (fatura denetimi)
CREATE TABLE IF NOT EXISTS logistics.invoice_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id),
    provider_id UUID NOT NULL REFERENCES logistics.providers(id),
    contract_id UUID REFERENCES logistics.contracts(id),
    contract_rate_id UUID REFERENCES logistics.contract_rates(id),
    invoice_number VARCHAR(100),
    invoice_amount NUMERIC(18,2) NOT NULL,
    expected_amount NUMERIC(18,2) NOT NULL,
    difference NUMERIC(18,2) NOT NULL,
    difference_percent NUMERIC(8,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'TRY',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    audit_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invoice_audits_tenant ON logistics.invoice_audits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_audits_shipment ON logistics.invoice_audits(shipment_id);
CREATE INDEX IF NOT EXISTS idx_invoice_audits_status ON logistics.invoice_audits(tenant_id, status);

-- Routing Rules (kural motoru)
CREATE TABLE IF NOT EXISTS logistics.routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    priority INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    origin_region VARCHAR(100),
    destination_region VARCHAR(100),
    vehicle_category INT,
    min_weight_kg NUMERIC(18,2),
    max_weight_kg NUMERIC(18,2),
    is_hazardous BOOLEAN,
    requires_cold_chain BOOLEAN,
    preferred_provider_id UUID REFERENCES logistics.providers(id),
    preferred_contract_id UUID REFERENCES logistics.contracts(id),
    action VARCHAR(100),
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_tenant ON logistics.routing_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON logistics.routing_rules(tenant_id, priority);
