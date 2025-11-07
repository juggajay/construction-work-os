-- Migration: Update user_project_ids() for Role-Based Project Visibility
-- Created: 2025-11-07
-- Purpose: Modify project visibility to restrict non-admin users to only see
--          projects they're explicitly assigned to via project_access table

-- ============================================================================
-- PROBLEM
-- ============================================================================
-- Current implementation: ALL organization members see ALL projects in their org
-- This violates principle of least privilege and causes privacy concerns

-- ============================================================================
-- SOLUTION
-- ============================================================================
-- New implementation:
--   - Owners/Admins: See ALL organization projects (current behavior)
--   - Regular Members: Only see projects they're explicitly assigned to

-- Update the function (cannot DROP because it's referenced by RLS policies)
CREATE OR REPLACE FUNCTION user_project_ids(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(project_id UUID) AS $$
  -- Owners and admins see ALL org projects
  SELECT DISTINCT p.id
  FROM projects p
  INNER JOIN organization_members om ON om.org_id = p.org_id
  WHERE om.user_id = user_uuid
    AND om.role IN ('owner', 'admin')  -- KEY CHANGE: Role check added
    AND om.deleted_at IS NULL
    AND om.joined_at IS NOT NULL
    AND p.deleted_at IS NULL

  UNION

  -- Other members ONLY see projects they're explicitly assigned to
  SELECT pa.project_id
  FROM project_access pa
  WHERE pa.user_id = user_uuid
    AND pa.deleted_at IS NULL
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- IMPACT ANALYSIS
-- ============================================================================
-- BEFORE (Current Behavior):
--   - Owner: Sees all 10 org projects ✓
--   - Admin: Sees all 10 org projects ✓
--   - Manager (assigned to 2 projects): Sees all 10 org projects ✗ (security issue)
--   - Supervisor (assigned to 3 projects): Sees all 10 org projects ✗ (security issue)
--
-- AFTER (New Behavior):
--   - Owner: Sees all 10 org projects ✓
--   - Admin: Sees all 10 org projects ✓
--   - Manager (assigned to 2 projects): Sees only 2 assigned projects ✓
--   - Supervisor (assigned to 3 projects): Sees only 3 assigned projects ✓

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- IMPORTANT: Before deploying this change, run the migration script
-- (20251107000005_assign_existing_users_to_projects.sql) to ensure all
-- existing org members are assigned to appropriate projects via project_access.
--
-- Without the migration script, existing users who are not owners/admins
-- will suddenly lose visibility to projects they could previously see.

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To rollback to previous behavior (NOT RECOMMENDED for security):
-- CREATE OR REPLACE FUNCTION user_project_ids(user_uuid UUID DEFAULT auth.uid())
-- RETURNS TABLE(project_id UUID) AS $$
--   SELECT DISTINCT p.id
--   FROM projects p
--   INNER JOIN organization_members om ON om.org_id = p.org_id
--   WHERE om.user_id = user_uuid
--     AND om.deleted_at IS NULL
--     AND om.joined_at IS NOT NULL
--     AND p.deleted_at IS NULL
--   UNION
--   SELECT pa.project_id
--   FROM project_access pa
--   WHERE pa.user_id = user_uuid
--     AND pa.deleted_at IS NULL
-- $$ LANGUAGE SQL STABLE SECURITY DEFINER;
