-- =====================================================
-- DIAGNOSE PERMISSION ISSUES
-- =====================================================

-- 1. Check your user ID and profile
SELECT
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'jaysonryan22@gmail.com';

-- 2. Check if profile exists
SELECT
  id,
  full_name,
  created_at,
  settings
FROM profiles
WHERE id IN (SELECT id FROM auth.users WHERE email = 'jaysonryan22@gmail.com');

-- 3. Check organization memberships
SELECT
  om.user_id,
  om.organization_id,
  om.role,
  om.created_at,
  o.name as org_name,
  o.slug as org_slug
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id IN (SELECT id FROM auth.users WHERE email = 'jaysonryan22@gmail.com');

-- 4. Check all organizations you have access to
SELECT
  o.id,
  o.name,
  o.slug,
  o.created_at,
  om.role
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
WHERE om.user_id IN (SELECT id FROM auth.users WHERE email = 'jaysonryan22@gmail.com');

-- 5. Check RLS policies on organizations table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'organizations';

-- 6. Check RLS policies on organization_members table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'organization_members';

-- 7. Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('organizations', 'organization_members', 'profiles', 'projects', 'daily_reports');
