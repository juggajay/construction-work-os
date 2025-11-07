-- Migration: Assign Existing Organization Members to Projects
-- Created: 2025-11-07
-- Purpose: Prevent existing users from losing project access when role-based
--          visibility is enabled. This migration must run BEFORE deploying the
--          updated user_project_ids() function.

-- ============================================================================
-- PROBLEM
-- ============================================================================
-- The updated user_project_ids() function restricts non-owner/admin users to
-- only see projects they're explicitly assigned to via project_access table.
--
-- However, existing users may not have project_access entries because the
-- previous system allowed all org members to see all org projects automatically.
--
-- Without this migration, existing users would suddenly lose access to projects
-- they previously could see, breaking the application for them.

-- ============================================================================
-- SOLUTION
-- ============================================================================
-- Assign ALL organization members to ALL projects in their organization with
-- appropriate default roles:
--   - Owners/Admins → 'manager' role (full project control)
--   - Regular Members → 'viewer' role (read-only access)
--
-- After this migration runs, org owners can manually adjust roles and remove
-- unnecessary access on a case-by-case basis.

-- ============================================================================
-- MIGRATION SCRIPT
-- ============================================================================

-- Insert project access records for all org members
-- Skip if project_access entry already exists (idempotent)
INSERT INTO project_access (
  project_id,
  user_id,
  role,
  granted_by,
  granted_at,
  created_at,
  updated_at
)
SELECT
  p.id AS project_id,
  om.user_id,
  -- Assign role based on org role
  CASE
    WHEN om.role IN ('owner', 'admin') THEN 'manager'::project_role
    ELSE 'viewer'::project_role
  END AS role,
  om.user_id AS granted_by,  -- Self-granted during migration
  NOW() AS granted_at,
  NOW() AS created_at,
  NOW() AS updated_at
FROM projects p
CROSS JOIN organization_members om
WHERE om.org_id = p.org_id
  AND om.deleted_at IS NULL
  AND om.joined_at IS NOT NULL
  AND p.deleted_at IS NULL
  AND NOT EXISTS (
    -- Skip if user already has project access (idempotent check)
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = p.id
      AND pa.user_id = om.user_id
      AND pa.deleted_at IS NULL
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify the results:
--
-- 1. Count total project access records created:
--    SELECT COUNT(*) FROM project_access WHERE granted_at >= NOW() - INTERVAL '5 minutes';
--
-- 2. Verify all org members have access to all org projects:
--    SELECT
--      o.name AS org_name,
--      COUNT(DISTINCT om.user_id) AS total_members,
--      COUNT(DISTINCT p.id) AS total_projects,
--      COUNT(DISTINCT pa.id) AS total_access_records,
--      COUNT(DISTINCT om.user_id) * COUNT(DISTINCT p.id) AS expected_records
--    FROM organizations o
--    LEFT JOIN organization_members om ON om.org_id = o.id AND om.deleted_at IS NULL
--    LEFT JOIN projects p ON p.org_id = o.id AND p.deleted_at IS NULL
--    LEFT JOIN project_access pa ON pa.user_id = om.user_id AND pa.project_id = p.id AND pa.deleted_at IS NULL
--    WHERE o.deleted_at IS NULL
--    GROUP BY o.id, o.name;
--
-- 3. Check role distribution:
--    SELECT role, COUNT(*) FROM project_access
--    WHERE granted_at >= NOW() - INTERVAL '5 minutes'
--    GROUP BY role;
--
-- 4. Test user project visibility (replace with actual user UUID):
--    SELECT * FROM user_project_ids('user-uuid-here');

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To rollback this migration (remove auto-assigned access):
-- WARNING: This will remove project access for users who were auto-assigned!
-- Only run this if you need to undo the migration immediately after running it.
--
-- DELETE FROM project_access
-- WHERE granted_by = user_id  -- Self-granted
--   AND granted_at >= NOW() - INTERVAL '1 hour'  -- Created recently
--   AND granted_at <= NOW();
--
-- Safer alternative: Manually review and remove unnecessary access via the UI

-- ============================================================================
-- POST-MIGRATION STEPS
-- ============================================================================
-- After this migration runs successfully:
--
-- 1. Deploy the updated user_project_ids() function
--    (20251107000002_update_user_project_ids_function.sql)
--
-- 2. Test with different user roles:
--    - Owner: Should see all org projects (unchanged)
--    - Admin: Should see all org projects (unchanged)
--    - Manager: Should see only assigned projects (new behavior)
--    - Viewer: Should see only assigned projects (new behavior)
--
-- 3. Communicate to org owners:
--    - All members now have explicit project access
--    - Owners should review and adjust roles/access as needed
--    - Use the Project Team Management UI to manage access
--
-- 4. Monitor for issues:
--    - Check error logs for permission denied errors
--    - Verify no users report losing project access
--    - Adjust access manually if needed

-- ============================================================================
-- EXAMPLE SCENARIOS
-- ============================================================================
-- Scenario 1: Small org with 3 members and 2 projects
--   - Before migration: 0 project_access records
--   - After migration: 6 project_access records (3 members × 2 projects)
--   - Result: All members can access both projects
--
-- Scenario 2: Large org with 50 members (10 owners/admins, 40 members) and 20 projects
--   - Before migration: Some project_access records may exist
--   - After migration: Up to 1,000 project_access records (50 × 20)
--   - Owners/admins get 'manager' role: 10 × 20 = 200 records
--   - Regular members get 'viewer' role: 40 × 20 = 800 records
--   - Result: All members can access all projects (owners can reduce access later)
--
-- Scenario 3: Org with existing project assignments
--   - Before migration: Some users already assigned to specific projects
--   - After migration: Idempotent - existing assignments are preserved
--   - Only missing assignments are created
--   - Result: No duplicate records, all users have access

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
-- This migration may take time for large organizations:
--   - 10 members × 5 projects = 50 inserts (~50ms)
--   - 100 members × 50 projects = 5,000 inserts (~5 seconds)
--   - 1,000 members × 100 projects = 100,000 inserts (~1-2 minutes)
--
-- For very large organizations (>10,000 inserts), consider:
--   - Running during off-peak hours
--   - Batch processing by organization
--   - Monitoring database CPU and memory usage
