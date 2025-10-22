-- Migration: Create Submittal Versions Table
-- Created: 2025-01-23
-- Task: 1.4 - Create Submittal Versions Schema Migration
-- Purpose: Track version history for resubmittals with change notes

-- UP Migration

-- Create submittal_versions table
CREATE TABLE IF NOT EXISTS submittal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to submittal
  submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,

  -- Version information
  version TEXT NOT NULL,  -- "Rev 0", "Rev A", "Rev B", etc.
  version_number INTEGER NOT NULL CHECK (version_number >= 0),

  -- Change documentation
  notes TEXT,  -- What changed in this version (required for resubmittals)

  -- User tracking
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),

  -- Timestamps
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_submittal_version UNIQUE(submittal_id, version_number)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_submittal_versions_submittal_id
  ON submittal_versions(submittal_id);

-- Composite index for finding specific versions
CREATE INDEX IF NOT EXISTS idx_submittal_versions_submittal_version
  ON submittal_versions(submittal_id, version_number);

CREATE INDEX IF NOT EXISTS idx_submittal_versions_uploaded_at
  ON submittal_versions(uploaded_at);

-- Comments for documentation
COMMENT ON TABLE submittal_versions IS 'Version history for submittals, tracking resubmittals and changes';
COMMENT ON COLUMN submittal_versions.version IS 'Human-readable version (Rev 0, Rev A, Rev B, etc.)';
COMMENT ON COLUMN submittal_versions.version_number IS 'Sortable version number (0, 1, 2, etc.)';
COMMENT ON COLUMN submittal_versions.notes IS 'Description of what changed in this version (required for resubmittals)';

-- DOWN Migration (Rollback)
-- DROP INDEX IF EXISTS idx_submittal_versions_uploaded_at;
-- DROP INDEX IF EXISTS idx_submittal_versions_submittal_version;
-- DROP INDEX IF EXISTS idx_submittal_versions_submittal_id;
-- DROP TABLE IF EXISTS submittal_versions CASCADE;
