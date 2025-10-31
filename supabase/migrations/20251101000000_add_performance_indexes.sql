-- Migration: Add Performance Indexes
-- Purpose: Improve query performance for commonly filtered and joined tables
-- Impact: Significantly reduces query time as data grows
-- Date: 2025-11-01

-- ============================================================================
-- PROJECT COSTS INDEXES
-- ============================================================================

-- Used in project metrics calculation (SUM aggregations)
CREATE INDEX IF NOT EXISTS idx_project_costs_project_deleted
  ON project_costs(project_id, deleted_at)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- RFI INDEXES
-- ============================================================================

-- Used for filtering RFIs by project and status (e.g., open RFIs count)
CREATE INDEX IF NOT EXISTS idx_rfis_project_status_deleted
  ON rfis(project_id, status, deleted_at)
  WHERE deleted_at IS NULL;

-- Used for RFI due date queries and sorting
CREATE INDEX IF NOT EXISTS idx_rfis_due_date
  ON rfis(due_date DESC)
  WHERE deleted_at IS NULL AND status != 'closed';

-- ============================================================================
-- DAILY REPORTS INDEXES
-- ============================================================================

-- Used for fetching daily reports ordered by date (most common query)
CREATE INDEX IF NOT EXISTS idx_daily_reports_project_date
  ON daily_reports(project_id, report_date DESC, deleted_at)
  WHERE deleted_at IS NULL;

-- Used for filtering by status (approved reports)
CREATE INDEX IF NOT EXISTS idx_daily_reports_status
  ON daily_reports(status, deleted_at)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- CHANGE ORDERS INDEXES
-- ============================================================================

-- Used for filtering change orders by project and status
CREATE INDEX IF NOT EXISTS idx_change_orders_project_status
  ON change_orders(project_id, status, deleted_at)
  WHERE deleted_at IS NULL;

-- Used for calculating total cost impact
CREATE INDEX IF NOT EXISTS idx_change_orders_cost_impact
  ON change_orders(project_id, cost_impact)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- SUBMITTALS INDEXES
-- ============================================================================

-- Used for filtering submittals by project and status
CREATE INDEX IF NOT EXISTS idx_submittals_project_status
  ON submittals(project_id, status, deleted_at)
  WHERE deleted_at IS NULL;

-- Used for finding pending reviews (assigned_reviewer_id queries)
CREATE INDEX IF NOT EXISTS idx_submittals_reviewer_status
  ON submittals(assigned_reviewer_id, status, deleted_at)
  WHERE deleted_at IS NULL AND status = 'submitted';

-- ============================================================================
-- BUDGET LINE ITEMS INDEXES
-- ============================================================================

-- Used for budget aggregations and calculations
CREATE INDEX IF NOT EXISTS idx_budget_line_items_budget
  ON budget_line_items(project_budget_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Used for category-based filtering and aggregations
CREATE INDEX IF NOT EXISTS idx_budget_line_items_category
  ON budget_line_items(category, deleted_at)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PROJECT ACCESS INDEXES
-- ============================================================================

-- Used for checking user access to projects (RLS policies use this)
CREATE INDEX IF NOT EXISTS idx_project_access_user_project
  ON project_access(user_id, project_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Used for getting all users with access to a project
CREATE INDEX IF NOT EXISTS idx_project_access_project
  ON project_access(project_id, deleted_at)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- ORGANIZATION MEMBERS INDEXES
-- ============================================================================

-- Used for checking org membership (RLS policies use this)
CREATE INDEX IF NOT EXISTS idx_org_members_user_org
  ON organization_members(user_id, org_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Used for listing org members
CREATE INDEX IF NOT EXISTS idx_org_members_org
  ON organization_members(org_id, deleted_at)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- AUDIT LOGS INDEXES
-- ============================================================================

-- Used for filtering audit logs by resource
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs(resource_type, resource_id, created_at DESC);

-- Used for filtering audit logs by user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON audit_logs(user_id, created_at DESC);

-- ============================================================================
-- PROJECTS INDEXES
-- ============================================================================

-- Used for filtering projects by organization
CREATE INDEX IF NOT EXISTS idx_projects_org
  ON projects(org_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Used for filtering projects by status
CREATE INDEX IF NOT EXISTS idx_projects_status
  ON projects(status, deleted_at)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PERFORMANCE ANALYSIS
-- ============================================================================

-- To verify index usage, run these queries in production:
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
--
-- This will show which indexes are being used most frequently.
