-- Migration: Create RLS Policies for Submittals
-- Created: 2025-01-23
-- Task: 1.7 - Create RLS Policies for Submittals
-- Purpose: Enforce project-scoped access control with role-based write permissions

-- UP Migration

-- Enable RLS on submittals table
ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can view submittals in projects they have access to
CREATE POLICY "Users can view submittals in accessible projects"
  ON submittals FOR SELECT
  USING (
    project_id IN (SELECT project_id FROM user_project_ids())
    AND deleted_at IS NULL
  );

-- INSERT Policy: Users can create submittals in projects they have access to
CREATE POLICY "Users can create submittals in accessible projects"
  ON submittals FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM user_project_ids())
    AND created_by = auth.uid()
  );

-- UPDATE Policy: Complex logic based on status and role
-- 1. Creator can update drafts
-- 2. Current reviewer can update assigned submittals (to change status/stage)
-- 3. Project managers can update any submittal
CREATE POLICY "Users can update submittals based on role and status"
  ON submittals FOR UPDATE
  USING (
    -- Can view the submittal
    project_id IN (SELECT project_id FROM user_project_ids())
    AND deleted_at IS NULL
    AND (
      -- Creator can update drafts
      (status = 'draft' AND created_by = auth.uid())
      OR
      -- Current reviewer can update assigned submittals
      (current_reviewer_id = auth.uid())
      OR
      -- Project managers can update any submittal
      is_project_manager(auth.uid(), project_id)
    )
  )
  WITH CHECK (
    -- Same conditions for check
    project_id IN (SELECT project_id FROM user_project_ids())
    AND (
      (status = 'draft' AND created_by = auth.uid())
      OR
      (current_reviewer_id = auth.uid())
      OR
      is_project_manager(auth.uid(), project_id)
    )
  );

-- DELETE Policy: Only project managers can soft-delete submittals
CREATE POLICY "Project managers can delete submittals"
  ON submittals FOR DELETE
  USING (
    is_project_manager(auth.uid(), project_id)
  );

-- Comments for documentation
COMMENT ON POLICY "Users can view submittals in accessible projects" ON submittals
  IS 'Users can view submittals in projects they have access to via org membership or direct project access';

COMMENT ON POLICY "Users can create submittals in accessible projects" ON submittals
  IS 'Users can create submittals in projects they have access to, and must set themselves as creator';

COMMENT ON POLICY "Users can update submittals based on role and status" ON submittals
  IS 'Creators can update drafts, reviewers can update assigned submittals, and project managers can update any';

COMMENT ON POLICY "Project managers can delete submittals" ON submittals
  IS 'Only project managers can soft-delete submittals (sets deleted_at timestamp)';

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Project managers can delete submittals" ON submittals;
-- DROP POLICY IF EXISTS "Users can update submittals based on role and status" ON submittals;
-- DROP POLICY IF EXISTS "Users can create submittals in accessible projects" ON submittals;
-- DROP POLICY IF EXISTS "Users can view submittals in accessible projects" ON submittals;
-- ALTER TABLE submittals DISABLE ROW LEVEL SECURITY;
