-- Migration: Add Performance Indexes for Daily Reports
-- Created: 2025-01-22
-- Description: Additional indexes for query optimization

-- UP Migration

-- Index on report_date for date range queries (chronological order)
CREATE INDEX IF NOT EXISTS daily_reports_report_date_idx
  ON daily_reports(report_date DESC)
  WHERE deleted_at IS NULL;

-- Index on status for filtering (with non-deleted filter)
CREATE INDEX IF NOT EXISTS daily_reports_status_idx
  ON daily_reports(status)
  WHERE deleted_at IS NULL;

-- Composite index for project + date queries (common access pattern)
CREATE INDEX IF NOT EXISTS daily_reports_project_date_idx
  ON daily_reports(project_id, report_date DESC)
  WHERE deleted_at IS NULL;

-- Index on submitted_at for approval workflows
CREATE INDEX IF NOT EXISTS daily_reports_submitted_at_idx
  ON daily_reports(submitted_at DESC)
  WHERE status = 'submitted' AND deleted_at IS NULL;

-- Index on approved_at for reporting
CREATE INDEX IF NOT EXISTS daily_reports_approved_at_idx
  ON daily_reports(approved_at DESC)
  WHERE status = 'approved' AND deleted_at IS NULL;

-- Index on attachments for photo galleries
CREATE INDEX IF NOT EXISTS daily_report_attachments_report_category_idx
  ON daily_report_attachments(daily_report_id, category, created_at DESC);

-- Index on GPS coordinates for location-based queries
CREATE INDEX IF NOT EXISTS daily_report_attachments_gps_idx
  ON daily_report_attachments(gps_latitude, gps_longitude)
  WHERE gps_latitude IS NOT NULL AND gps_longitude IS NOT NULL;

-- DOWN Migration (Rollback)
-- DROP INDEX IF EXISTS daily_report_attachments_gps_idx;
-- DROP INDEX IF EXISTS daily_report_attachments_report_category_idx;
-- DROP INDEX IF EXISTS daily_reports_approved_at_idx;
-- DROP INDEX IF EXISTS daily_reports_submitted_at_idx;
-- DROP INDEX IF EXISTS daily_reports_project_date_idx;
-- DROP INDEX IF EXISTS daily_reports_status_idx;
-- DROP INDEX IF EXISTS daily_reports_report_date_idx;
