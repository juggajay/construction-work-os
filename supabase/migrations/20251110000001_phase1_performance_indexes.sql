-- ============================================================================
-- PHASE 1 PERFORMANCE OPTIMIZATION: Missing Indexes for N+1 Query Fixes
-- Created: 2025-11-10
-- Protector Status: ✅ APPROVED (LOW RISK)
-- ============================================================================
-- PURPOSE: Add strategic indexes to support Phase 1 query optimizations
--
-- These indexes eliminate N+1 query patterns by optimizing:
--   1. Change order approvals by version
--   2. RFI responses chronological ordering
--   3. Submittal attachments by version
--   4. Daily report attachments by category
--   5. RFI assigned user JOINs
--   6. Project invoice batch queries
--
-- EXPECTED IMPACT:
--   - 40-60% faster JOIN queries
--   - Support for 1-query detail page loads (vs 3-4 queries)
--   - Enable efficient profile JOINs for RFI list
-- ============================================================================

-- ============================================================================
-- CHANGE ORDER APPROVALS - Version-based queries
-- ============================================================================
-- Supports: Task 1.3b - Change order detail N+1 fix
-- Query pattern: SELECT * FROM change_order_approvals
--                WHERE change_order_id = $1 AND version = $2

CREATE INDEX IF NOT EXISTS idx_change_order_approvals_co_version
  ON change_order_approvals(change_order_id, version)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_change_order_approvals_co_version IS
  'Performance: Fast approval lookups by change order and version for detail pages';

-- ============================================================================
-- RFI RESPONSES - Chronological ordering
-- ============================================================================
-- Supports: RFI detail views with response history
-- Query pattern: SELECT * FROM rfi_responses
--                WHERE rfi_id = $1 ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_rfi_responses_rfi_created
  ON rfi_responses(rfi_id, created_at DESC)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_rfi_responses_rfi_created IS
  'Performance: Chronological response ordering for RFI detail pages';

-- ============================================================================
-- SUBMITTAL ATTACHMENTS - Version filtering
-- ============================================================================
-- Supports: Task 1.3a - Submittal detail N+1 fix
-- Query pattern: SELECT * FROM submittal_attachments
--                WHERE submittal_id = $1 AND version_number = $2

CREATE INDEX IF NOT EXISTS idx_submittal_attachments_submittal_version
  ON submittal_attachments(submittal_id, version_number, created_at)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_submittal_attachments_submittal_version IS
  'Performance: Fast attachment lookups by submittal and version number';

-- ============================================================================
-- SUBMITTAL REVIEWS - Submittal-based queries
-- ============================================================================
-- Supports: Task 1.3a - Submittal detail N+1 fix
-- Query pattern: SELECT * FROM submittal_reviews
--                WHERE submittal_id = $1 ORDER BY reviewed_at

CREATE INDEX IF NOT EXISTS idx_submittal_reviews_submittal
  ON submittal_reviews(submittal_id, reviewed_at DESC)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_submittal_reviews_submittal IS
  'Performance: Fast review history lookups for submittal detail pages';

-- ============================================================================
-- SUBMITTAL VERSIONS - Version history queries
-- ============================================================================
-- Supports: Task 1.3a - Submittal detail N+1 fix
-- Query pattern: SELECT * FROM submittal_versions
--                WHERE submittal_id = $1 ORDER BY version_number

CREATE INDEX IF NOT EXISTS idx_submittal_versions_submittal
  ON submittal_versions(submittal_id, version_number DESC)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_submittal_versions_submittal IS
  'Performance: Fast version history lookups for submittal detail pages';

-- ============================================================================
-- CHANGE ORDER LINE ITEMS - Version filtering
-- ============================================================================
-- Supports: Task 1.3b - Change order detail N+1 fix
-- Query pattern: SELECT * FROM change_order_line_items
--                WHERE change_order_id = $1 AND version = $2 ORDER BY sort_order

CREATE INDEX IF NOT EXISTS idx_change_order_line_items_version
  ON change_order_line_items(change_order_id, version, sort_order)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_change_order_line_items_version IS
  'Performance: Fast line item queries by change order and version';

-- ============================================================================
-- DAILY REPORT ATTACHMENTS - Category filtering
-- ============================================================================
-- Supports: Daily report detail views with categorized attachments
-- Query pattern: SELECT * FROM daily_report_attachments
--                WHERE daily_report_id = $1 AND category = $2

CREATE INDEX IF NOT EXISTS idx_daily_report_attachments_category
  ON daily_report_attachments(daily_report_id, category)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_daily_report_attachments_category IS
  'Performance: Fast attachment lookups by daily report and category';

-- ============================================================================
-- RFIS - Assigned user JOIN optimization
-- ============================================================================
-- Supports: Task 1.2 - RFI page N+1 fix (JOIN with profiles table)
-- Query pattern: SELECT r.*, p.* FROM rfis r
--                LEFT JOIN profiles p ON r.assigned_to_id = p.id

CREATE INDEX IF NOT EXISTS idx_rfis_assigned_to
  ON rfis(assigned_to_id)
  WHERE deleted_at IS NULL AND assigned_to_id IS NOT NULL;

COMMENT ON INDEX idx_rfis_assigned_to IS
  'Performance: Fast RFI joins with assigned user profiles';

-- ============================================================================
-- PROJECT INVOICES - Batch queries with status filtering
-- ============================================================================
-- Supports: Task 1.1 - Project health batch queries
-- Query pattern: SELECT * FROM project_invoices
--                WHERE project_id IN (...) AND status = $1 ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_project_invoices_batch
  ON project_invoices(project_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_project_invoices_batch IS
  'Performance: Batch invoice queries for project health dashboard';

-- ============================================================================
-- PERFORMANCE EXPECTATIONS
-- ============================================================================
-- With these indexes, query performance should improve:
--
-- Before (without indexes):
--   - Change order detail: 3-4 queries × 50-100ms = 150-400ms
--   - Submittal detail: 4 queries × 50-100ms = 200-400ms
--   - RFI list (50 items): 2 queries × 100ms = 200ms
--
-- After (with indexes + JOINs):
--   - Change order detail: 1 query × 30-50ms = 30-50ms
--   - Submittal detail: 1 query × 30-50ms = 30-50ms
--   - RFI list (50 items): 1 query × 80-120ms = 80-120ms
--
-- Expected improvement: 3-4x faster detail pages, 2x faster list pages

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these with EXPLAIN ANALYZE to verify index usage:
--
-- 1. Change order detail with approvals:
-- EXPLAIN ANALYZE
-- SELECT * FROM change_order_approvals
-- WHERE change_order_id = 'uuid' AND version = 1;
--
-- 2. Submittal detail with attachments:
-- EXPLAIN ANALYZE
-- SELECT * FROM submittal_attachments
-- WHERE submittal_id = 'uuid' AND version_number = 1;
--
-- 3. RFI list with assigned users:
-- EXPLAIN ANALYZE
-- SELECT r.*, p.full_name FROM rfis r
-- LEFT JOIN profiles p ON r.assigned_to_id = p.id
-- WHERE r.project_id IN ('uuid1', 'uuid2');
--
-- Look for "Index Scan using idx_*" rather than "Seq Scan"

-- ============================================================================
-- ROLLBACK PROCEDURE
-- ============================================================================
-- If needed, drop indexes in reverse order:
--
-- DROP INDEX IF EXISTS idx_project_invoices_batch;
-- DROP INDEX IF EXISTS idx_rfis_assigned_to;
-- DROP INDEX IF EXISTS idx_daily_report_attachments_category;
-- DROP INDEX IF EXISTS idx_change_order_line_items_version;
-- DROP INDEX IF EXISTS idx_submittal_versions_submittal;
-- DROP INDEX IF EXISTS idx_submittal_reviews_submittal;
-- DROP INDEX IF EXISTS idx_submittal_attachments_submittal_version;
-- DROP INDEX IF EXISTS idx_rfi_responses_rfi_created;
-- DROP INDEX IF EXISTS idx_change_order_approvals_co_version;

-- ============================================================================
-- PROTECTOR AGENT VALIDATION
-- ============================================================================
-- ✅ GATE 1: Pre-implementation - APPROVED
-- ✅ GATE 2: Code review - APPROVED (SQL syntax valid, IF NOT EXISTS used)
-- ⏳ GATE 3: Testing - Pending deployment
-- ⏳ GATE 4: Deployment - Pending
-- ⏳ GATE 5: Post-deployment - Pending monitoring
