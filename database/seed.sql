-- Demo Seed Data for Academic Defense & Evaluation
-- Default Demo User: demo@example.com / Password: DemoPassword123!
-- Password Hash generated using bcrypt salt 10 for 'DemoPassword123!'

INSERT INTO users (id, name, email, password_hash, mfa_enabled, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Demo Security Officer',
    'demo@example.com',
    '$2a$10$f6B0K8R5x7U6aJ8/O8/2vO5x9/aTzX6gT5S5gW0oTqI7H9y4h0XKy',
    false,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Sample initial audit log for demo
INSERT INTO audit_logs (user_id, action, ip_address, user_agent, metadata, created_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SYSTEM_INITIALIZED',
    '127.0.0.1',
    'SecureVault-SeedService/1.0',
    '{"info": "Database seeded with demonstration account"}'::jsonb,
    NOW()
);
