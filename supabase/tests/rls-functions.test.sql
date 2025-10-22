-- ============================================================================
-- RLS Helper Functions Integration Tests
-- Run these tests against a local Supabase instance
-- Usage: npm run db:psql -f supabase/tests/rls-functions.test.sql
-- ============================================================================

-- Clean up test data before running tests
DELETE FROM project_access WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test-rls-%'
);
DELETE FROM organization_members WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test-rls-%'
);
DELETE FROM projects WHERE name LIKE 'Test RLS%';
DELETE FROM organizations WHERE name LIKE 'Test RLS%';

-- Create test users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'test-rls-user1@example.com', crypt('password', gen_salt('bf')), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'test-rls-user2@example.com', crypt('password', gen_salt('bf')), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'test-rls-user3@example.com', crypt('password', gen_salt('bf')), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test organizations
INSERT INTO organizations (id, name, slug)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test RLS Org A', 'test-rls-org-a'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test RLS Org B', 'test-rls-org-b')
ON CONFLICT (id) DO NOTHING;

-- Create test org memberships
INSERT INTO organization_members (org_id, user_id, role, invited_by, joined_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', '11111111-1111-1111-1111-111111111111', NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member', '11111111-1111-1111-1111-111111111111', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'admin', '33333333-3333-3333-3333-333333333333', NOW())
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Create test projects
INSERT INTO projects (id, org_id, name, status)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test RLS Project 1', 'active'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test RLS Project 2', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create test project access (user1 has direct access to project 2)
INSERT INTO project_access (project_id, user_id, role, granted_by)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'viewer', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ============================================================================
-- TEST: user_org_ids()
-- ============================================================================

\echo '=== TEST: user_org_ids() ==='

-- Test 1: User1 should see Org A (member)
SELECT
  CASE
    WHEN COUNT(*) = 1 AND
         (SELECT COUNT(*) FROM user_org_ids('11111111-1111-1111-1111-111111111111') WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 1
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User1 should see Org A' AS test_name
FROM user_org_ids('11111111-1111-1111-1111-111111111111');

-- Test 2: User2 should see Org A (member)
SELECT
  CASE
    WHEN COUNT(*) = 1
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User2 should see Org A' AS test_name
FROM user_org_ids('22222222-2222-2222-2222-222222222222');

-- Test 3: User3 should see Org B (admin)
SELECT
  CASE
    WHEN COUNT(*) = 1 AND
         (SELECT COUNT(*) FROM user_org_ids('33333333-3333-3333-3333-333333333333') WHERE org_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 1
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User3 should see Org B' AS test_name
FROM user_org_ids('33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- TEST: user_project_ids()
-- ============================================================================

\echo ''
\echo '=== TEST: user_project_ids() ==='

-- Test 4: User1 should see Project 1 (via org) and Project 2 (direct access)
SELECT
  CASE
    WHEN COUNT(*) = 2
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User1 should see 2 projects (via org + direct access)' AS test_name
FROM user_project_ids('11111111-1111-1111-1111-111111111111');

-- Test 5: User2 should see only Project 1 (via org)
SELECT
  CASE
    WHEN COUNT(*) = 1 AND
         (SELECT COUNT(*) FROM user_project_ids('22222222-2222-2222-2222-222222222222') WHERE project_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc') = 1
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User2 should see only Project 1 (via org membership)' AS test_name
FROM user_project_ids('22222222-2222-2222-2222-222222222222');

-- Test 6: User3 should see only Project 2 (via org)
SELECT
  CASE
    WHEN COUNT(*) = 1
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User3 should see only Project 2' AS test_name
FROM user_project_ids('33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- TEST: is_org_admin()
-- ============================================================================

\echo ''
\echo '=== TEST: is_org_admin() ==='

-- Test 7: User1 should be admin of Org A (owner)
SELECT
  CASE
    WHEN is_org_admin('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = true
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User1 should be admin of Org A (owner)' AS test_name;

-- Test 8: User2 should NOT be admin of Org A (member only)
SELECT
  CASE
    WHEN is_org_admin('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = false
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User2 should NOT be admin of Org A (member only)' AS test_name;

-- Test 9: User3 should be admin of Org B (admin role)
SELECT
  CASE
    WHEN is_org_admin('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = true
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User3 should be admin of Org B (admin role)' AS test_name;

-- Test 10: User1 should NOT be admin of Org B (not a member)
SELECT
  CASE
    WHEN is_org_admin('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = false
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User1 should NOT be admin of Org B (not a member)' AS test_name;

-- ============================================================================
-- TEST: is_project_manager()
-- ============================================================================

\echo ''
\echo '=== TEST: is_project_manager() ==='

-- Add a project manager for testing
INSERT INTO project_access (project_id, user_id, role, granted_by)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'manager', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Test 11: User2 should be manager of Project 1
SELECT
  CASE
    WHEN is_project_manager('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc') = true
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User2 should be manager of Project 1' AS test_name;

-- Test 12: User1 should NOT be manager of Project 2 (viewer only)
SELECT
  CASE
    WHEN is_project_manager('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd') = false
    THEN 'PASS'
    ELSE 'FAIL'
  END AS test_result,
  'User1 should NOT be manager of Project 2 (viewer only)' AS test_name;

-- ============================================================================
-- CLEANUP
-- ============================================================================

\echo ''
\echo '=== Cleaning up test data ==='

DELETE FROM project_access WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test-rls-%'
);
DELETE FROM organization_members WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test-rls-%'
);
DELETE FROM projects WHERE name LIKE 'Test RLS%';
DELETE FROM organizations WHERE name LIKE 'Test RLS%';

\echo 'Tests complete!'
