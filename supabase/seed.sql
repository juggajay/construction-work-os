/*
 * Development Seed Data
 * This file creates sample data for local development
 *
 * Note: Run this AFTER migrations and AFTER creating a user via Supabase Auth UI
 * Replace 'YOUR_USER_ID' with your actual user ID from Supabase Auth
 */

-- ============================================================================
-- SAMPLE ORGANIZATIONS
-- ============================================================================

INSERT INTO organizations (id, name, slug, settings) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ACME Construction', 'acme-construction', '{"project_number_format": "P-{seq:4}"}'),
  ('00000000-0000-0000-0000-000000000002', 'BuildRight LLC', 'buildright-llc', '{"project_number_format": "BR-{seq:3}"}'),
  ('00000000-0000-0000-0000-000000000003', 'Premier Builders', 'premier-builders', '{"project_number_format": "{seq:5}"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE ORGANIZATION MEMBERS
-- ============================================================================

-- Replace this UUID with your actual user ID from Supabase Auth
-- You can get it by running: SELECT id FROM auth.users WHERE email = 'your@email.com';
DO $$
DECLARE
  sample_user_id UUID;
BEGIN
  -- Try to get the first user from auth.users
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;

  IF sample_user_id IS NOT NULL THEN
    -- Add the user as owner to all sample orgs
    INSERT INTO organization_members (org_id, user_id, role, invited_by, joined_at) VALUES
      ('00000000-0000-0000-0000-000000000001', sample_user_id, 'owner', sample_user_id, now()),
      ('00000000-0000-0000-0000-000000000002', sample_user_id, 'owner', sample_user_id, now()),
      ('00000000-0000-0000-0000-000000000003', sample_user_id, 'admin', sample_user_id, now())
    ON CONFLICT (org_id, user_id) DO NOTHING;

    RAISE NOTICE 'Added user % to sample organizations', sample_user_id;
  ELSE
    RAISE NOTICE 'No users found. Please create a user via Supabase Auth first.';
  END IF;
END $$;

-- ============================================================================
-- SAMPLE PROJECTS
-- ============================================================================

INSERT INTO projects (id, org_id, name, number, address, status, budget, start_date, end_date) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Downtown Office Renovation',
    'P-0001',
    '123 Main Street, San Francisco, CA 94105',
    'active',
    2500000.00,
    '2025-01-15',
    '2025-06-30'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Harbor View Apartments',
    'P-0002',
    '456 Bay Avenue, San Francisco, CA 94110',
    'planning',
    8500000.00,
    '2025-03-01',
    '2026-02-28'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Tech Campus Expansion',
    'P-0003',
    '789 Innovation Drive, Palo Alto, CA 94301',
    'active',
    15000000.00,
    '2024-11-01',
    '2025-10-31'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'Retail Center Build-Out',
    'BR-001',
    '321 Commerce Blvd, Oakland, CA 94607',
    'active',
    3200000.00,
    '2025-02-01',
    '2025-07-15'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000003',
    'Medical Office Complex',
    '00001',
    '555 Health Way, Berkeley, CA 94704',
    'planning',
    12000000.00,
    '2025-04-01',
    '2026-03-31'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE PROJECT ACCESS
-- ============================================================================

DO $$
DECLARE
  sample_user_id UUID;
BEGIN
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;

  IF sample_user_id IS NOT NULL THEN
    -- Grant project manager access to all sample projects
    INSERT INTO project_access (project_id, user_id, role, trade, granted_by, granted_at) VALUES
      ('10000000-0000-0000-0000-000000000001', sample_user_id, 'manager', NULL, sample_user_id, now()),
      ('10000000-0000-0000-0000-000000000002', sample_user_id, 'manager', NULL, sample_user_id, now()),
      ('10000000-0000-0000-0000-000000000003', sample_user_id, 'manager', NULL, sample_user_id, now()),
      ('10000000-0000-0000-0000-000000000004', sample_user_id, 'manager', NULL, sample_user_id, now()),
      ('10000000-0000-0000-0000-000000000005', sample_user_id, 'manager', NULL, sample_user_id, now())
    ON CONFLICT (project_id, user_id) DO NOTHING;

    RAISE NOTICE 'Granted project access to user %', sample_user_id;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify organizations
SELECT 'Organizations created:' AS info, COUNT(*) AS count FROM organizations WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- Verify projects
SELECT 'Projects created:' AS info, COUNT(*) AS count FROM projects WHERE org_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- Verify memberships
SELECT 'Organization memberships:' AS info, COUNT(*) AS count FROM organization_members WHERE org_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- Verify project access
SELECT 'Project access grants:' AS info, COUNT(*) AS count FROM project_access WHERE project_id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000005'
);
