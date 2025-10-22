-- Migration: Create RLS Policies for Daily Reports
-- Created: 2025-01-22
-- Description: Row-level security policies for daily_reports table

-- UP Migration

-- Enable RLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view daily reports in accessible projects
CREATE POLICY "Users can view daily reports in accessible projects"
  ON daily_reports FOR SELECT
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
  );

-- Policy: Users can create draft daily reports in their projects
CREATE POLICY "Users can create draft daily reports"
  ON daily_reports FOR INSERT
  WITH CHECK (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND status = 'draft'
    AND created_by = auth.uid()
  );

-- Policy: Users can update their own draft daily reports
CREATE POLICY "Users can update their own draft reports"
  ON daily_reports FOR UPDATE
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND status = 'draft'
    AND created_by = auth.uid()
  )
  WITH CHECK (
    project_id IN (SELECT user_project_ids(auth.uid()))
  );

-- Policy: Users with project access can update submitted reports (for approval)
-- Note: Role-based authorization (project_manager, admin) handled in application layer
CREATE POLICY "Users can update submitted reports"
  ON daily_reports FOR UPDATE
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND status IN ('submitted', 'approved')
  )
  WITH CHECK (
    project_id IN (SELECT user_project_ids(auth.uid()))
  );

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Users can update submitted reports" ON daily_reports;
-- DROP POLICY IF EXISTS "Users can update their own draft reports" ON daily_reports;
-- DROP POLICY IF EXISTS "Users can create draft daily reports" ON daily_reports;
-- DROP POLICY IF EXISTS "Users can view daily reports in accessible projects" ON daily_reports;
-- ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;
