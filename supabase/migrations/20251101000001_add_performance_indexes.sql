-- ============================================================================
-- PERFORMANCE OPTIMIZATION: Add Missing Indexes
-- ============================================================================
-- This migration adds critical indexes to improve query performance
-- as the database grows. These indexes target frequently queried columns
-- and foreign key relationships that are used in filtering and joins.
--
-- IMPACT: Significant performance improvement for:
-- - Project metrics calculations
-- - RFI listings and filtering
-- - Daily report queries
-- - Change order tracking
-- - Budget/cost aggregations
-- ============================================================================

-- ============================================================================
-- PROJECT INVOICES - Used in budget/cost calculations
-- ============================================================================

-- Composite index for project-based invoice queries (filtered by deleted_at)
CREATE INDEX IF NOT EXISTS idx_project_invoices_project_deleted
  ON project_invoices(project_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Index for amount aggregations
CREATE INDEX IF NOT EXISTS idx_project_invoices_amount
  ON project_invoices(project_id, amount)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- RFIS - Frequently filtered by status and project
-- ============================================================================

-- Composite index for project + status filtering
CREATE INDEX IF NOT EXISTS idx_rfis_project_status_deleted
  ON rfis(project_id, status, deleted_at)
  WHERE deleted_at IS NULL;

-- Note: due_date and ball_in_court columns may not exist in production yet
-- Uncomment these indexes after adding those columns to the schema
--
-- CREATE INDEX IF NOT EXISTS idx_rfis_due_date
--   ON rfis(project_id, due_date)
--   WHERE deleted_at IS NULL AND status NOT IN ('closed', 'cancelled');
--
-- CREATE INDEX IF NOT EXISTS idx_rfis_responsible_party
--   ON rfis(project_id, ball_in_court, status)
--   WHERE deleted_at IS NULL;

-- ============================================================================
-- DAILY REPORTS - Ordered by date, filtered by project
-- ============================================================================

-- Composite index for project + date queries (DESC for recent-first)
CREATE INDEX IF NOT EXISTS idx_daily_reports_project_date
  ON daily_reports(project_id, report_date DESC, deleted_at)
  WHERE deleted_at IS NULL;

-- Index for weather condition queries
CREATE INDEX IF NOT EXISTS idx_daily_reports_weather
  ON daily_reports(project_id, weather_condition)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- CHANGE ORDERS - Filtered by status and type
-- ============================================================================

-- Composite index for project + status filtering
CREATE INDEX IF NOT EXISTS idx_change_orders_project_status
  ON change_orders(project_id, status, deleted_at)
  WHERE deleted_at IS NULL;

-- Index for change order amounts (cost impact tracking)
CREATE INDEX IF NOT EXISTS idx_change_orders_amount
  ON change_orders(project_id, cost_impact)
  WHERE deleted_at IS NULL;

-- Index for change order dates (timeline tracking)
CREATE INDEX IF NOT EXISTS idx_change_orders_dates
  ON change_orders(project_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- SUBMITTALS - Filtered by status and review stage
-- ============================================================================

-- Composite index for project + status filtering
CREATE INDEX IF NOT EXISTS idx_submittals_project_status
  ON submittals(project_id, status, deleted_at)
  WHERE deleted_at IS NULL;

-- Note: due_date column may not exist in production submittals table yet
-- Uncomment after adding due_date column
--
-- CREATE INDEX IF NOT EXISTS idx_submittals_due_date
--   ON submittals(project_id, due_date)
--   WHERE deleted_at IS NULL AND status != 'approved';

-- ============================================================================
-- BUDGET LINE ITEMS - Used in cost aggregations
-- ============================================================================

-- Composite index for project-based budget queries
CREATE INDEX IF NOT EXISTS idx_budget_line_items_project
  ON budget_line_items(project_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Index for cost tracking by category
CREATE INDEX IF NOT EXISTS idx_budget_line_items_category
  ON budget_line_items(project_id, category)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PROJECT COSTS - Cost tracking and analysis
-- ============================================================================

-- Composite index for project cost queries
CREATE INDEX IF NOT EXISTS idx_project_costs_project
  ON project_costs(project_id, cost_date DESC, deleted_at)
  WHERE deleted_at IS NULL;

-- Index for cost category aggregations
CREATE INDEX IF NOT EXISTS idx_project_costs_category
  ON project_costs(project_id, category)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- DAILY REPORT RELATED TABLES - Crew, Equipment, Materials
-- ============================================================================

-- Daily report crew entries
CREATE INDEX IF NOT EXISTS idx_crew_entries_report
  ON daily_report_crew_entries(daily_report_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Daily report equipment entries
CREATE INDEX IF NOT EXISTS idx_equipment_entries_report
  ON daily_report_equipment_entries(daily_report_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Daily report material entries
CREATE INDEX IF NOT EXISTS idx_material_entries_report
  ON daily_report_material_entries(daily_report_id, deleted_at)
  WHERE deleted_at IS NULL;

-- Daily report incidents
CREATE INDEX IF NOT EXISTS idx_incidents_report
  ON daily_report_incidents(daily_report_id, severity)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- AUDIT LOGS - Large table that will benefit from indexes
-- ============================================================================

-- Index for audit log queries by entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id, created_at DESC);

-- Index for user activity tracking
CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON audit_logs(user_id, created_at DESC);

-- Index for organization audit trail
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization
  ON audit_logs(organization_id, created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_project_invoices_project_deleted IS 'Performance: Fast project invoice lookups for metrics';
COMMENT ON INDEX idx_rfis_project_status_deleted IS 'Performance: Fast RFI filtering by project and status';
COMMENT ON INDEX idx_daily_reports_project_date IS 'Performance: Fast daily report queries ordered by date';
COMMENT ON INDEX idx_change_orders_project_status IS 'Performance: Fast change order filtering and tracking';
COMMENT ON INDEX idx_submittals_project_status IS 'Performance: Fast submittal queries and filtering';
COMMENT ON INDEX idx_audit_logs_entity IS 'Performance: Fast audit trail queries by entity';

-- ============================================================================
-- ANALYSIS: Verify index usage
-- ============================================================================
-- After deployment, monitor index usage with:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
