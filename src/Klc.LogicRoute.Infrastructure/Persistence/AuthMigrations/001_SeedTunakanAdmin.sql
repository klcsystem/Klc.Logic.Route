-- Seed admin user: tunakan.elmas@klcsystem.com (password: Tu2026!)
-- Mirrors the default admin seed in 000_AuthSchema.sql. Idempotent (re-runs safely on every startup).
DO $$
DECLARE
    default_tenant UUID := '00000000-0000-0000-0000-000000000001';
    admin_role_id  UUID := '00000000-0000-0000-0000-000000000010';
BEGIN
    INSERT INTO auth.users (id, tenant_id, email, password_hash, first_name, last_name, is_active, role_id)
    VALUES (
        gen_random_uuid(),
        default_tenant,
        'tunakan.elmas@klcsystem.com',
        '$2b$11$NDOyDkTFChEdU2GHbWdX8uUucv/J1E64e4Mqb3j7LZ1TtOuNPml.2',
        'Tunakan',
        'Elmas',
        TRUE,
        admin_role_id
    )
    ON CONFLICT (tenant_id, email) DO NOTHING;
END $$;
