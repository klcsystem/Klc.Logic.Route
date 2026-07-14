-- ============================================================
-- 039_InsuranceBrokerUsers
-- Sigorta broker portali icin BIREYSEL, sifreli kullanicilar.
-- Onceki tasarim tek paylasimli apiKey idi -> kimin teklif verdigi bilinmiyordu.
-- Artik her broker calisani kendi e-posta/sifresiyle girer, her teklifte
-- KIMIN verdigi (quoted_by) kaydedilir. Idempotent.
-- ============================================================
CREATE TABLE IF NOT EXISTS logistics.insurance_broker_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    partner_id UUID NOT NULL REFERENCES logistics.insurance_partners(id),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_insurance_broker_users_email
    ON logistics.insurance_broker_users (LOWER(email)) WHERE is_deleted = FALSE;

-- Teklife "kim verdi" bilgisi
ALTER TABLE logistics.insurance_quotes ADD COLUMN IF NOT EXISTS quoted_by_user_id UUID;
ALTER TABLE logistics.insurance_quotes ADD COLUMN IF NOT EXISTS quoted_by_name VARCHAR(200);
