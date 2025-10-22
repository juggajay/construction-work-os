-- Migration: Create RLS Policies for Submittal Versions
-- Created: 2025-01-23
-- Task: 1.9 - Create RLS Policies for Submittal Versions
-- Purpose: Enforce access control for version history via parent submittal

-- UP Migration

-- Enable RLS on submittal_versions table
ALTER TABLE submittal_versions ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can view version history for submittals in accessible projects
CREATE POLICY "Users can view version history in accessible projects"
  ON submittal_versions FOR SELECT
  USING (
    submittal_id IN (
      SELECT id FROM submittals
      WHERE project_id IN (SELECT project_id FROM user_project_ids())
        AND deleted_at IS NULL
    )
  );

-- INSERT Policy: Creators can add version records when creating resubmittals
CREATE POLICY "Creators can add version records"
  ON submittal_versions FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND submittal_id IN (
      SELECT id FROM submittals
      WHERE project_id IN (SELECT project_id FROM user_project_ids())
        AND deleted_at IS NULL
    )
  );

-- UPDATE Policy: Version records are immutable (no updates allowed)
-- This is intentionally left empty - version history should not be edited

-- DELETE Policy: Version records are immutable (no deletes allowed)
-- This is intentionally left empty - version history should be preserved for audit

-- Comments for documentation
COMMENT ON POLICY "Users can view version history in accessible projects" ON submittal_versions
  IS 'Users can view version history for submittals in projects they have access to';

COMMENT ON POLICY "Creators can add version records" ON submittal_versions
  IS 'Users can create version records when creating resubmittals for accessible projects';

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Creators can add version records" ON submittal_versions;
-- DROP POLICY IF EXISTS "Users can view version history in accessible projects" ON submittal_versions;
-- ALTER TABLE submittal_versions DISABLE ROW LEVEL SECURITY;
