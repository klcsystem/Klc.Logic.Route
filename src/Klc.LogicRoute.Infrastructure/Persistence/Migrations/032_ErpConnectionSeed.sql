-- 032: ERP baglantilari icin ornek veri (ErpConnectionPage bos donuyordu)
INSERT INTO logistics.erp_connections (id, tenant_id, name, erp_type, endpoint_url, username, is_active, last_sync_at, last_sync_status, is_deleted, created_by, created_at)
SELECT * FROM (VALUES
    ('e5000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000001'::UUID,
     'SAP S/4HANA Üretim', 0, 'https://sap.example.com/api/v1', 'sap_integration',
     TRUE, NOW() - INTERVAL '2 hours', 'Success', FALSE, 'seed', NOW() - INTERVAL '90 days'),
    ('e5000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000001'::UUID,
     'Logo Tiger 3 Enterprise', 4, 'https://logo.example.com/rest/v2', 'logo_api',
     TRUE, NOW() - INTERVAL '30 minutes', 'Success', FALSE, 'seed', NOW() - INTERVAL '60 days'),
    ('e5000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000001'::UUID,
     'Netsis 3 Standard', 5, 'https://netsis.example.com/api', 'netsis_svc',
     FALSE, NOW() - INTERVAL '15 days', 'Failed: Connection timeout', FALSE, 'seed', NOW() - INTERVAL '120 days')
) AS v(id, tenant_id, name, erp_type, endpoint_url, username, is_active, last_sync_at, last_sync_status, is_deleted, created_by, created_at)
WHERE NOT EXISTS (SELECT 1 FROM logistics.erp_connections WHERE id = v.id);
