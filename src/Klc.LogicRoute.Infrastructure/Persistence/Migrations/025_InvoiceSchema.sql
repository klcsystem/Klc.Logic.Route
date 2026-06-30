-- ============================================================================
-- 025_InvoiceSchema.sql
-- Automated Invoicing — Otomatik Faturalama
-- ============================================================================

-- Invoices — faturalar
CREATE TABLE IF NOT EXISTS logistics.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    invoice_number VARCHAR(100) NOT NULL,
    customer_id UUID,
    customer_name VARCHAR(300),
    period_month INT NOT NULL,
    period_year INT NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    status VARCHAR(20) NOT NULL DEFAULT 'Draft',    -- Draft, Sent, Paid
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON logistics.invoices(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON logistics.invoices(status, tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_period ON logistics.invoices(period_year, period_month, tenant_id) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON logistics.invoices(invoice_number);

-- Invoice Lines — fatura kalemleri
CREATE TABLE IF NOT EXISTS logistics.invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    invoice_id UUID NOT NULL REFERENCES logistics.invoices(id) ON DELETE CASCADE,
    shipment_id UUID,
    description TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON logistics.invoice_lines(invoice_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoice_lines_shipment ON logistics.invoice_lines(shipment_id) WHERE is_deleted = FALSE;
