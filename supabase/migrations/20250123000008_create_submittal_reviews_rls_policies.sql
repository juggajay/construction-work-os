-- Migration: Create RLS Policies for Submittal Reviews
-- Created: 2025-01-23
-- Task: 1.8 - Create RLS Policies for Submittal Reviews
-- Purpose: Enforce access control for review records via parent submittal

-- UP Migration

-- Enable RLS on submittal_reviews table
ALTER TABLE submittal_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can view reviews for submittals in accessible projects
CREATE POLICY "Users can view reviews in accessible projects"
  ON submittal_reviews FOR SELECT
  USING (
    submittal_id IN (
      SELECT id FROM submittals
      WHERE project_id IN (SELECT project_id FROM user_project_ids())
        AND deleted_at IS NULL
    )
  );

-- INSERT Policy: Only current reviewer can create reviews
-- This ensures users can only add reviews for submittals assigned to them
CREATE POLICY "Current reviewer can create reviews"
  ON submittal_reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND submittal_id IN (
      SELECT id FROM submittals
      WHERE current_reviewer_id = auth.uid()
        AND project_id IN (SELECT project_id FROM user_project_ids())
        AND deleted_at IS NULL
    )
  );

-- UPDATE Policy: Reviews are immutable (no updates allowed)
-- This is intentionally left empty - reviews should not be edited after creation

-- DELETE Policy: Reviews are immutable (no deletes allowed)
-- This is intentionally left empty - reviews should not be deleted for audit trail

-- Comments for documentation
COMMENT ON POLICY "Users can view reviews in accessible projects" ON submittal_reviews
  IS 'Users can view review history for submittals in projects they have access to';

COMMENT ON POLICY "Current reviewer can create reviews" ON submittal_reviews
  IS 'Only the current assigned reviewer can add review records, ensuring authorization';

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Current reviewer can create reviews" ON submittal_reviews;
-- DROP POLICY IF EXISTS "Users can view reviews in accessible projects" ON submittal_reviews;
-- ALTER TABLE submittal_reviews DISABLE ROW LEVEL SECURITY;
