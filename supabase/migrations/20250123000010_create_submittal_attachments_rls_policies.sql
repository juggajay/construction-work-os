-- Migration: Create RLS Policies for Submittal Attachments
-- Created: 2025-01-23
-- Task: 1.10 - Create RLS Policies for Submittal Attachments
-- Purpose: Enforce access control for file attachments via parent submittal

-- UP Migration

-- Enable RLS on submittal_attachments table
ALTER TABLE submittal_attachments ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can view attachments for submittals in accessible projects
CREATE POLICY "Users can view attachments in accessible projects"
  ON submittal_attachments FOR SELECT
  USING (
    submittal_id IN (
      SELECT id FROM submittals
      WHERE project_id IN (SELECT project_id FROM user_project_ids())
        AND deleted_at IS NULL
    )
  );

-- INSERT Policy: Users can upload attachments to accessible submittals
CREATE POLICY "Users can upload attachments to accessible submittals"
  ON submittal_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND submittal_id IN (
      SELECT id FROM submittals
      WHERE project_id IN (SELECT project_id FROM user_project_ids())
        AND deleted_at IS NULL
    )
  );

-- UPDATE Policy: Attachments are immutable (no updates allowed)
-- This is intentionally left empty - attachments should not be edited after upload

-- DELETE Policy: Creators can delete attachments from draft submittals only
CREATE POLICY "Creators can delete attachments from draft submittals"
  ON submittal_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND submittal_id IN (
      SELECT id FROM submittals
      WHERE status = 'draft'
        AND project_id IN (SELECT project_id FROM user_project_ids())
        AND deleted_at IS NULL
    )
  );

-- Comments for documentation
COMMENT ON POLICY "Users can view attachments in accessible projects" ON submittal_attachments
  IS 'Users can view and download attachments for submittals in projects they have access to';

COMMENT ON POLICY "Users can upload attachments to accessible submittals" ON submittal_attachments
  IS 'Users can upload attachments to submittals in projects they have access to';

COMMENT ON POLICY "Creators can delete attachments from draft submittals" ON submittal_attachments
  IS 'Users can only delete attachments they uploaded, and only from draft submittals';

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Creators can delete attachments from draft submittals" ON submittal_attachments;
-- DROP POLICY IF EXISTS "Users can upload attachments to accessible submittals" ON submittal_attachments;
-- DROP POLICY IF EXISTS "Users can view attachments in accessible projects" ON submittal_attachments;
-- ALTER TABLE submittal_attachments DISABLE ROW LEVEL SECURITY;
