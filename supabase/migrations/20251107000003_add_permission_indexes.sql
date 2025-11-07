-- Migration: Add Performance Indexes for Permission Checks
-- Created: 2025-11-07
-- Purpose: Optimize permission check queries with strategic indexes

-- ============================================================================
-- PROBLEM
-- ============================================================================
-- Permission check functions query organization_members, project_access, and
-- project_costs/daily_reports tables frequently. Without proper indexes, these
-- queries can become slow, especially with:
--   - Large number of org members (100+)
--   - Many projects per org (50+)
--   - Frequent permission checks on each page load

-- ============================================================================
-- INDEXES FOR project_access TABLE
-- ============================================================================

-- Index for user-based project lookups (most common query pattern)
-- Used by: user_project_ids(), all permission check functions
CREATE INDEX IF NOT EXISTS idx_project_access_user_not_deleted
  ON project_access(user_id)
  WHERE deleted_at IS NULL;

-- Index for project-based permission checks with role filtering
-- Used by: can_edit_budget(), can_create_cost(), can_approve_change_order(), etc.
CREATE INDEX IF NOT EXISTS idx_project_access_project_role
  ON project_access(project_id, role)
  WHERE deleted_at IS NULL;

-- Composite index for user + project lookups (checking specific access)
-- Used by: team management, permission checks for specific user on specific project
CREATE INDEX IF NOT EXISTS idx_project_access_user_project
  ON project_access(user_id, project_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- INDEXES FOR organization_members TABLE
-- ============================================================================

-- Index for user role lookups (for admin checks)
-- Used by: user_project_ids(), is_org_admin(), all permission checks
CREATE INDEX IF NOT EXISTS idx_org_members_user_role
  ON organization_members(user_id, role)
  WHERE deleted_at IS NULL AND joined_at IS NOT NULL;

-- Index for org-based member lookups
-- Used by: team management, org member listings
CREATE INDEX IF NOT EXISTS idx_org_members_org
  ON organization_members(org_id)
  WHERE deleted_at IS NULL AND joined_at IS NOT NULL;

-- ============================================================================
-- INDEXES FOR project_costs TABLE (for ownership checks)
-- ============================================================================

-- Index for creator-based cost lookups
-- Used by: can_edit_cost(), can_delete_cost() ownership checks for supervisors
CREATE INDEX IF NOT EXISTS idx_project_costs_created_by
  ON project_costs(created_by, project_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- INDEXES FOR daily_reports TABLE (for ownership checks)
-- ============================================================================

-- Index for creator-based daily report lookups
-- Used by: can_edit_daily_report() ownership checks for supervisors
CREATE INDEX IF NOT EXISTS idx_daily_reports_created_by
  ON daily_reports(created_by, project_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- INDEXES FOR projects TABLE
-- ============================================================================

-- Index for org-based project lookups (already exists but ensuring it's optimal)
-- Used by: user_project_ids(), project listings
CREATE INDEX IF NOT EXISTS idx_projects_org_not_deleted
  ON projects(org_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PERFORMANCE EXPECTATIONS
-- ============================================================================
-- With these indexes, permission checks should complete in:
--   - < 10ms for simple checks (can_edit_budget, can_manage_team)
--   - < 20ms for ownership checks (can_edit_cost with cost_id)
--   - < 50ms for user_project_ids() with 100+ projects
--
-- Without indexes, the same queries could take:
--   - 100-500ms with moderate data
--   - 1-5 seconds with large datasets

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries with EXPLAIN ANALYZE to verify index usage:
--
-- 1. Check user's project access:
-- EXPLAIN ANALYZE
-- SELECT * FROM user_project_ids('user-uuid-here');
--
-- 2. Check permission:
-- EXPLAIN ANALYZE
-- SELECT can_edit_budget('user-uuid-here', 'project-uuid-here');
--
-- 3. Check ownership:
-- EXPLAIN ANALYZE
-- SELECT can_edit_cost('user-uuid-here', 'project-uuid-here', 'cost-uuid-here');
--
-- Look for "Index Scan" rather than "Seq Scan" in the output

-- ============================================================================
-- MAINTENANCE
-- ============================================================================
-- Indexes are automatically updated by Postgres on INSERT/UPDATE/DELETE.
-- Consider running VACUUM ANALYZE periodically to keep statistics fresh:
--
-- VACUUM ANALYZE project_access;
-- VACUUM ANALYZE organization_members;
-- VACUUM ANALYZE project_costs;
-- VACUUM ANALYZE daily_reports;
