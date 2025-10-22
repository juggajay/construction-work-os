-- Migration: Create RLS Policies for Attachments
-- Created: 2025-01-22
-- Description: Row-level security policies for daily_report_attachments table

-- UP Migration

-- Enable RLS
ALTER TABLE daily_report_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments in accessible reports
CREATE POLICY "Users can view attachments in accessible reports"
  ON daily_report_attachments FOR SELECT
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
    )
  );

-- Policy: Users can upload attachments to draft reports
CREATE POLICY "Users can upload attachments to draft reports"
  ON daily_report_attachments FOR INSERT
  WITH CHECK (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
    AND uploaded_by = auth.uid()
  );

-- Policy: Uploaders can delete attachments from draft reports
CREATE POLICY "Uploaders can delete attachments from draft reports"
  ON daily_report_attachments FOR DELETE
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
    AND uploaded_by = auth.uid()
  );

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Uploaders can delete attachments from draft reports" ON daily_report_attachments;
-- DROP POLICY IF EXISTS "Users can upload attachments to draft reports" ON daily_report_attachments;
-- DROP POLICY IF EXISTS "Users can view attachments in accessible reports" ON daily_report_attachments;
-- ALTER TABLE daily_report_attachments DISABLE ROW LEVEL SECURITY;
