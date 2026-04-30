-- ============================================================================
-- 000_InitialSchema.sql
-- LogicRoute initial schema bootstrap for auth schema.
-- Fully idempotent — re-running on an already-initialised DB is a no-op.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS auth;

-- Tenants
CREATE TABLE IF NOT EXISTS auth.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    domain VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    api_key VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settings TEXT
);

-- Operation Claims (Roles)
CREATE TABLE IF NOT EXISTS auth.operation_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- User Operation Claims (Role Permissions)
CREATE TABLE IF NOT EXISTS auth.user_operation_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES auth.operation_claims(id) ON DELETE CASCADE,
    permission VARCHAR(200) NOT NULL,
    UNIQUE(role_id, permission)
);

-- Users
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    email VARCHAR(256) NOT NULL,
    password_hash VARCHAR(500),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    role_id UUID NOT NULL REFERENCES auth.operation_claims(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON auth.users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON auth.users(role_id);
CREATE INDEX IF NOT EXISTS idx_operation_claims_tenant ON auth.operation_claims(tenant_id);
