-- ============================================================================
-- Seed Data for Development Environment
-- Construction Work OS - Local Development Setup
--
-- This script creates sample data for testing and development.
-- Run this after migrations: npm run db:reset
-- ============================================================================

-- ============================================================================
-- USERS (auth.users)
-- ============================================================================
-- Note: In production, users are created via Supabase Auth signup
-- For local dev, we create test users with known credentials

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES
  -- Owner: owner@acme.com / password123
  (
    '00000000-0000-0000-0000-000000000001',
    'owner@acme.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alice Owner"}',
    'authenticated',
    'authenticated'
  ),
  -- Admin: admin@acme.com / password123
  (
    '00000000-0000-0000-0000-000000000002',
    'admin@acme.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Bob Admin"}',
    'authenticated',
    'authenticated'
  ),
  -- Member: member@acme.com / password123
  (
    '00000000-0000-0000-0000-000000000003',
    'member@acme.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Carol Member"}',
    'authenticated',
    'authenticated'
  ),
  -- Manager: manager@acme.com / password123
  (
    '00000000-0000-0000-0000-000000000004',
    'manager@acme.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"David Manager"}',
    'authenticated',
    'authenticated'
  ),
  -- Supervisor: supervisor@acme.com / password123
  (
    '00000000-0000-0000-0000-000000000005',
    'supervisor@acme.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Eve Supervisor"}',
    'authenticated',
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PROFILES
-- ============================================================================

INSERT INTO profiles (id, full_name, phone, settings)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Alice Owner', '+1-555-0001', '{"notifications":{"email":true,"push":true}}'),
  ('00000000-0000-0000-0000-000000000002', 'Bob Admin', '+1-555-0002', '{"notifications":{"email":true,"push":false}}'),
  ('00000000-0000-0000-0000-000000000003', 'Carol Member', '+1-555-0003', '{"notifications":{"email":false,"push":true}}'),
  ('00000000-0000-0000-0000-000000000004', 'David Manager', '+1-555-0004', '{"notifications":{"email":true,"push":true}}'),
  ('00000000-0000-0000-0000-000000000005', 'Eve Supervisor', '+1-555-0005', '{"notifications":{"email":true,"push":true}}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

INSERT INTO organizations (id, name, slug, settings)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'ACME Construction',
    'acme-construction',
    '{"timezone":"America/New_York","date_format":"MM/DD/YYYY"}'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'BuildCo Inc',
    'buildco-inc',
    '{"timezone":"America/Los_Angeles","date_format":"YYYY-MM-DD"}'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Premier Builders',
    'premier-builders',
    '{"timezone":"America/Chicago","date_format":"DD/MM/YYYY"}'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ORGANIZATION MEMBERS
-- ============================================================================

INSERT INTO organization_members (org_id, user_id, role, invited_by, joined_at)
VALUES
  -- ACME Construction
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 'owner', '00000000-0000-0000-0000-000000000001', NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000002', 'admin', '00000000-0000-0000-0000-000000000001', NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000003', 'member', '00000000-0000-0000-0000-000000000001', NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000004', 'member', '00000000-0000-0000-0000-000000000001', NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000005', 'member', '00000000-0000-0000-0000-000000000001', NOW()),

  -- BuildCo Inc
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000002', 'owner', '00000000-0000-0000-0000-000000000002', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000003', 'admin', '00000000-0000-0000-0000-000000000002', NOW()),

  -- Premier Builders
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001', 'admin', '00000000-0000-0000-0000-000000000001', NOW())
ON CONFLICT (org_id, user_id) DO NOTHING;

-- ============================================================================
-- PROJECTS
-- ============================================================================

INSERT INTO projects (id, org_id, name, number, address, status, budget, start_date, end_date, settings)
VALUES
  -- ACME Construction Projects
  (
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Sunset Tower',
    'ACME-2025-001',
    '123 Sunset Blvd, Los Angeles, CA 90028',
    'active',
    '5000000',
    '2025-01-15',
    '2025-12-31',
    '{"budget_currency":"USD","cost_tracking":true}'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Downtown Office Complex',
    'ACME-2025-002',
    '456 Main St, New York, NY 10001',
    'planning',
    '12000000',
    '2025-03-01',
    '2026-06-30',
    '{"budget_currency":"USD","cost_tracking":true}'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Riverside Apartments',
    'ACME-2024-045',
    '789 River Rd, Portland, OR 97201',
    'on_hold',
    '8000000',
    '2024-06-01',
    '2025-08-31',
    '{"budget_currency":"USD","cost_tracking":true}'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Historic Theater Renovation',
    'ACME-2024-032',
    '321 Broadway, Seattle, WA 98101',
    'completed',
    '3500000',
    '2024-01-10',
    '2024-11-30',
    '{"budget_currency":"USD","cost_tracking":true}'
  ),

  -- BuildCo Inc Projects
  (
    '55555555-5555-5555-5555-555555555555',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Tech Campus Phase 1',
    'BUILD-2025-101',
    '1000 Innovation Dr, Austin, TX 78701',
    'active',
    '25000000',
    '2025-02-01',
    '2026-12-31',
    '{"budget_currency":"USD","cost_tracking":true}'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Retail Strip Mall',
    'BUILD-2025-102',
    '200 Commerce Blvd, Houston, TX 77002',
    'planning',
    '4500000',
    '2025-04-15',
    '2025-10-31',
    '{"budget_currency":"USD","cost_tracking":true}'
  ),

  -- Premier Builders Projects
  (
    '77777777-7777-7777-7777-777777777777',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Lakefront Condos',
    'PB-2025-001',
    '500 Lake Shore Dr, Chicago, IL 60611',
    'active',
    '15000000',
    '2025-01-20',
    '2026-03-31',
    '{"budget_currency":"USD","cost_tracking":true}'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PROJECT ACCESS
-- ============================================================================

INSERT INTO project_access (project_id, user_id, role, trade, granted_by)
VALUES
  -- Sunset Tower (ACME-2025-001)
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000004', 'manager', NULL, '00000000-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000005', 'supervisor', 'electrical', '00000000-0000-0000-0000-000000000004'),

  -- Downtown Office Complex (ACME-2025-002)
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000004', 'manager', NULL, '00000000-0000-0000-0000-000000000002'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', 'viewer', NULL, '00000000-0000-0000-0000-000000000002'),

  -- Riverside Apartments (ACME-2024-045)
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000005', 'supervisor', 'plumbing', '00000000-0000-0000-0000-000000000001'),

  -- Tech Campus Phase 1 (BUILD-2025-101)
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000003', 'manager', NULL, '00000000-0000-0000-0000-000000000002'),

  -- Lakefront Condos (PB-2025-001)
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000001', 'viewer', NULL, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

\echo ''
\echo '=== Seed Data Summary ==='
\echo ''

\echo 'Organizations:'
SELECT id, name, slug FROM organizations ORDER BY name;

\echo ''
\echo 'Users and their roles:'
SELECT
  u.email,
  p.full_name,
  o.name AS org_name,
  om.role AS org_role
FROM auth.users u
JOIN profiles p ON u.id = p.id
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.org_id = o.id
ORDER BY u.email, o.name;

\echo ''
\echo 'Projects:'
SELECT
  p.number,
  p.name,
  p.status,
  o.name AS organization,
  p.budget
FROM projects p
JOIN organizations o ON p.org_id = o.id
ORDER BY o.name, p.number;

\echo ''
\echo 'Project Access:'
SELECT
  pr.number AS project,
  u.email AS user_email,
  pa.role,
  pa.trade
FROM project_access pa
JOIN projects pr ON pa.project_id = pr.id
JOIN auth.users u ON pa.user_id = u.id
ORDER BY pr.number, u.email;

\echo ''
\echo '✅ Seed data loaded successfully!'
\echo ''
\echo 'Login credentials (all passwords: password123):'
\echo '  - owner@acme.com (Owner of ACME Construction)'
\echo '  - admin@acme.com (Admin of ACME Construction, Owner of BuildCo Inc)'
\echo '  - member@acme.com (Member of ACME Construction, Admin of BuildCo Inc)'
\echo '  - manager@acme.com (Member of ACME Construction, Project Manager)'
\echo '  - supervisor@acme.com (Member of ACME Construction, Project Supervisor)'
\echo ''
