-- Seed default tenant, roles, permissions, and admin user
DO $$
DECLARE
    default_tenant UUID := '00000000-0000-0000-0000-000000000001';
    admin_role_id UUID := '00000000-0000-0000-0000-000000000010';
    logistics_mgr_role_id UUID := '00000000-0000-0000-0000-000000000011';
    ops_specialist_role_id UUID := '00000000-0000-0000-0000-000000000012';
    finance_role_id UUID := '00000000-0000-0000-0000-000000000013';
    executive_role_id UUID := '00000000-0000-0000-0000-000000000014';
    admin_user_id UUID := '00000000-0000-0000-0000-000000000100';
BEGIN
    -- Default tenant
    INSERT INTO auth.tenants (id, name, domain, is_active)
    VALUES (default_tenant, 'LogicRoute Default', 'logicroute.com', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Admin role
    INSERT INTO auth.operation_claims (id, tenant_id, name, description, is_system_role)
    VALUES (admin_role_id, default_tenant, 'Admin', 'Tam sistem erisimi', TRUE)
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Logistics Manager role
    INSERT INTO auth.operation_claims (id, tenant_id, name, description, is_system_role)
    VALUES (logistics_mgr_role_id, default_tenant, 'LogisticsManager', 'Lojistik yonetici - rota ve siparis yonetimi', TRUE)
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Operations Specialist role
    INSERT INTO auth.operation_claims (id, tenant_id, name, description, is_system_role)
    VALUES (ops_specialist_role_id, default_tenant, 'OperationsSpecialist', 'Operasyon uzmani - gunluk operasyonlar', TRUE)
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Finance role
    INSERT INTO auth.operation_claims (id, tenant_id, name, description, is_system_role)
    VALUES (finance_role_id, default_tenant, 'Finance', 'Finans - maliyet ve fatura yonetimi', TRUE)
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Executive role
    INSERT INTO auth.operation_claims (id, tenant_id, name, description, is_system_role)
    VALUES (executive_role_id, default_tenant, 'Executive', 'Ust yonetim - sadece raporlar', TRUE)
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Admin permissions (all)
    INSERT INTO auth.user_operation_claims (role_id, permission) VALUES
        (admin_role_id, 'order.create'),
        (admin_role_id, 'order.view'),
        (admin_role_id, 'order.manage'),
        (admin_role_id, 'order.delete'),
        (admin_role_id, 'route.create'),
        (admin_role_id, 'route.view'),
        (admin_role_id, 'route.manage'),
        (admin_role_id, 'route.optimize'),
        (admin_role_id, 'vehicle.create'),
        (admin_role_id, 'vehicle.view'),
        (admin_role_id, 'vehicle.manage'),
        (admin_role_id, 'driver.create'),
        (admin_role_id, 'driver.view'),
        (admin_role_id, 'driver.manage'),
        (admin_role_id, 'contract.create'),
        (admin_role_id, 'contract.view'),
        (admin_role_id, 'contract.manage'),
        (admin_role_id, 'invoice.create'),
        (admin_role_id, 'invoice.view'),
        (admin_role_id, 'invoice.manage'),
        (admin_role_id, 'report.view'),
        (admin_role_id, 'report.export'),
        (admin_role_id, 'user.create'),
        (admin_role_id, 'user.view'),
        (admin_role_id, 'user.manage'),
        (admin_role_id, 'user.delete'),
        (admin_role_id, 'settings.manage'),
        (admin_role_id, 'dashboard.view')
    ON CONFLICT (role_id, permission) DO NOTHING;

    -- LogisticsManager permissions
    INSERT INTO auth.user_operation_claims (role_id, permission) VALUES
        (logistics_mgr_role_id, 'order.create'),
        (logistics_mgr_role_id, 'order.view'),
        (logistics_mgr_role_id, 'order.manage'),
        (logistics_mgr_role_id, 'route.create'),
        (logistics_mgr_role_id, 'route.view'),
        (logistics_mgr_role_id, 'route.manage'),
        (logistics_mgr_role_id, 'route.optimize'),
        (logistics_mgr_role_id, 'vehicle.create'),
        (logistics_mgr_role_id, 'vehicle.view'),
        (logistics_mgr_role_id, 'vehicle.manage'),
        (logistics_mgr_role_id, 'driver.create'),
        (logistics_mgr_role_id, 'driver.view'),
        (logistics_mgr_role_id, 'driver.manage'),
        (logistics_mgr_role_id, 'contract.view'),
        (logistics_mgr_role_id, 'report.view'),
        (logistics_mgr_role_id, 'dashboard.view')
    ON CONFLICT (role_id, permission) DO NOTHING;

    -- OperationsSpecialist permissions
    INSERT INTO auth.user_operation_claims (role_id, permission) VALUES
        (ops_specialist_role_id, 'order.view'),
        (ops_specialist_role_id, 'order.manage'),
        (ops_specialist_role_id, 'route.view'),
        (ops_specialist_role_id, 'route.manage'),
        (ops_specialist_role_id, 'vehicle.view'),
        (ops_specialist_role_id, 'driver.view'),
        (ops_specialist_role_id, 'dashboard.view')
    ON CONFLICT (role_id, permission) DO NOTHING;

    -- Finance permissions
    INSERT INTO auth.user_operation_claims (role_id, permission) VALUES
        (finance_role_id, 'order.view'),
        (finance_role_id, 'contract.create'),
        (finance_role_id, 'contract.view'),
        (finance_role_id, 'contract.manage'),
        (finance_role_id, 'invoice.create'),
        (finance_role_id, 'invoice.view'),
        (finance_role_id, 'invoice.manage'),
        (finance_role_id, 'report.view'),
        (finance_role_id, 'report.export'),
        (finance_role_id, 'dashboard.view')
    ON CONFLICT (role_id, permission) DO NOTHING;

    -- Executive permissions (read-only)
    INSERT INTO auth.user_operation_claims (role_id, permission) VALUES
        (executive_role_id, 'order.view'),
        (executive_role_id, 'route.view'),
        (executive_role_id, 'contract.view'),
        (executive_role_id, 'invoice.view'),
        (executive_role_id, 'report.view'),
        (executive_role_id, 'report.export'),
        (executive_role_id, 'dashboard.view')
    ON CONFLICT (role_id, permission) DO NOTHING;

    -- Default admin user (password: admin123)
    INSERT INTO auth.users (id, tenant_id, email, password_hash, first_name, last_name, is_active, role_id)
    VALUES (
        admin_user_id,
        default_tenant,
        'admin@logicroute.com',
        '$2b$11$Zu/nw7krVnj1krEtAqpDuuGIr6kfu327kETVtfmLfmVCT4EgbYHei',
        'System',
        'Admin',
        TRUE,
        admin_role_id
    )
    ON CONFLICT (tenant_id, email) DO NOTHING;
END $$;
