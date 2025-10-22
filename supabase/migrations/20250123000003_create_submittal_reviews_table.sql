-- Migration: Create Submittal Reviews Table
-- Created: 2025-01-23
-- Task: 1.3 - Create Submittal Reviews Schema Migration
-- Purpose: Track multi-stage review workflow with approval actions and comments

-- UP Migration

-- Create review_action enum
CREATE TYPE review_action AS ENUM (
  'approved',
  'approved_as_noted',
  'revise_resubmit',
  'rejected',
  'forwarded'
);

-- Create submittal_reviews table
CREATE TABLE IF NOT EXISTS submittal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to submittal
  submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,

  -- Version being reviewed
  version_number INTEGER NOT NULL,  -- Which version this review applies to

  -- Review stage when action was taken
  stage review_stage NOT NULL,  -- gc_review, ae_review, or owner_review

  -- Reviewer and action
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  action review_action NOT NULL,

  -- Review comments and notes
  comments TEXT,

  -- Timestamps
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT check_version_number CHECK (version_number >= 0)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_submittal_reviews_submittal_id
  ON submittal_reviews(submittal_id);

-- Composite index for finding reviews by submittal, stage, and version
CREATE INDEX IF NOT EXISTS idx_submittal_reviews_submittal_stage_version
  ON submittal_reviews(submittal_id, stage, version_number);

CREATE INDEX IF NOT EXISTS idx_submittal_reviews_reviewer_id
  ON submittal_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_submittal_reviews_reviewed_at
  ON submittal_reviews(reviewed_at);

-- Comments for documentation
COMMENT ON TABLE submittal_reviews IS 'Audit trail of all review actions taken on submittals';
COMMENT ON COLUMN submittal_reviews.version_number IS 'Version of submittal being reviewed (0=Rev 0, 1=Rev A, etc.)';
COMMENT ON COLUMN submittal_reviews.stage IS 'Review stage when action was taken (gc_review, ae_review, owner_review)';
COMMENT ON COLUMN submittal_reviews.action IS 'Review decision: approved, approved_as_noted, revise_resubmit, rejected, or forwarded';

-- DOWN Migration (Rollback)
-- DROP INDEX IF EXISTS idx_submittal_reviews_reviewed_at;
-- DROP INDEX IF EXISTS idx_submittal_reviews_reviewer_id;
-- DROP INDEX IF EXISTS idx_submittal_reviews_submittal_stage_version;
-- DROP INDEX IF EXISTS idx_submittal_reviews_submittal_id;
-- DROP TABLE IF EXISTS submittal_reviews CASCADE;
-- DROP TYPE IF EXISTS review_action CASCADE;
