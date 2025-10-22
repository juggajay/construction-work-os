-- Migration: Create Submittals Core Schema
-- Created: 2025-01-23
-- Task: 1.2 - Create Submittals Core Schema Migration
-- Purpose: Main submittals table with status workflow, CSI mapping, and version tracking

-- UP Migration

-- Create submittal_type enum
CREATE TYPE submittal_type AS ENUM (
  'product_data',
  'shop_drawings',
  'samples',
  'mixed'
);

-- Create submittal_status enum
CREATE TYPE submittal_status AS ENUM (
  'draft',
  'submitted',
  'gc_review',
  'ae_review',
  'owner_review',
  'approved',
  'approved_as_noted',
  'revise_resubmit',
  'rejected',
  'cancelled'
);

-- Create review_stage enum
CREATE TYPE review_stage AS ENUM (
  'draft',
  'gc_review',
  'ae_review',
  'owner_review',
  'complete'
);

-- Create submittals table
CREATE TABLE IF NOT EXISTS submittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Project and organizational context
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT NOT NULL,  -- Auto-generated: "03 30 00-001" (CSI section + sequential)

  -- Core submittal information
  title TEXT NOT NULL,
  description TEXT,
  submittal_type submittal_type NOT NULL,

  -- CSI MasterFormat mapping
  spec_section TEXT NOT NULL,  -- e.g., "03 30 00"
  spec_section_title TEXT,     -- e.g., "Cast-in-Place Concrete"

  -- Status and workflow
  status submittal_status NOT NULL DEFAULT 'draft',
  current_stage review_stage NOT NULL DEFAULT 'draft',

  -- Version tracking for resubmittals
  version TEXT NOT NULL DEFAULT 'Rev 0',  -- "Rev 0", "Rev A", "Rev B", etc.
  version_number INTEGER NOT NULL DEFAULT 0,  -- For sorting: 0, 1, 2, etc.
  parent_submittal_id UUID REFERENCES submittals(id) ON DELETE SET NULL,  -- Link to parent for resubmittals

  -- User tracking
  created_by UUID NOT NULL REFERENCES auth.users(id),
  submitted_by_org UUID REFERENCES organizations(id),  -- Subcontractor organization
  current_reviewer_id UUID REFERENCES auth.users(id),  -- Ball-in-court: who needs to act

  -- Dates and deadlines
  submitted_at TIMESTAMPTZ,
  required_on_site DATE,  -- When material is needed on site
  lead_time_days INTEGER CHECK (lead_time_days >= 0),  -- Procurement lead time
  procurement_deadline DATE GENERATED ALWAYS AS (required_on_site - (lead_time_days || ' days')::INTERVAL) STORED,
  reviewed_at TIMESTAMPTZ,  -- Last review action timestamp
  closed_at TIMESTAMPTZ,    -- When status reached final state (approved/rejected/cancelled)

  -- Custom fields for extensibility
  custom_fields JSONB DEFAULT '{}'::JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,  -- Soft delete

  -- Constraints
  CONSTRAINT unique_submittal_number_per_project UNIQUE(project_id, spec_section, number),
  CONSTRAINT check_version_number CHECK (version_number >= 0),
  CONSTRAINT check_lead_time CHECK (lead_time_days IS NULL OR lead_time_days >= 0)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_submittals_project_id ON submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_status ON submittals(status);
CREATE INDEX IF NOT EXISTS idx_submittals_current_stage ON submittals(current_stage);
CREATE INDEX IF NOT EXISTS idx_submittals_spec_section ON submittals(spec_section);
CREATE INDEX IF NOT EXISTS idx_submittals_current_reviewer_id ON submittals(current_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_submittals_procurement_deadline ON submittals(procurement_deadline) WHERE procurement_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submittals_parent_submittal_id ON submittals(parent_submittal_id) WHERE parent_submittal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submittals_deleted_at ON submittals(deleted_at) WHERE deleted_at IS NULL;

-- Composite index for common queries (project + status + spec section)
CREATE INDEX IF NOT EXISTS idx_submittals_project_status_spec
  ON submittals(project_id, status, spec_section);

-- Composite index for overdue submittals
CREATE INDEX IF NOT EXISTS idx_submittals_overdue
  ON submittals(procurement_deadline, status)
  WHERE deleted_at IS NULL AND status NOT IN ('approved', 'approved_as_noted', 'rejected', 'cancelled');

-- Create GIN index for full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_submittals_search
  ON submittals USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER submittals_updated_at
  BEFORE UPDATE ON submittals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE submittals IS 'Main submittals table for tracking product data, shop drawings, and samples through multi-stage review workflow';
COMMENT ON COLUMN submittals.number IS 'Auto-generated sequential number per project and CSI spec section (e.g., "03 30 00-001")';
COMMENT ON COLUMN submittals.version IS 'Human-readable version (Rev 0, Rev A, Rev B, etc.)';
COMMENT ON COLUMN submittals.version_number IS 'Sortable version number (0, 1, 2, etc.)';
COMMENT ON COLUMN submittals.parent_submittal_id IS 'Link to parent submittal for resubmittals';
COMMENT ON COLUMN submittals.current_reviewer_id IS 'Ball-in-court: user who needs to act on this submittal';
COMMENT ON COLUMN submittals.procurement_deadline IS 'Calculated deadline for procurement (required_on_site - lead_time_days)';

-- DOWN Migration (Rollback)
-- DROP TRIGGER IF EXISTS submittals_updated_at ON submittals;
-- DROP INDEX IF EXISTS idx_submittals_search;
-- DROP INDEX IF EXISTS idx_submittals_overdue;
-- DROP INDEX IF EXISTS idx_submittals_project_status_spec;
-- DROP INDEX IF EXISTS idx_submittals_deleted_at;
-- DROP INDEX IF EXISTS idx_submittals_parent_submittal_id;
-- DROP INDEX IF EXISTS idx_submittals_procurement_deadline;
-- DROP INDEX IF EXISTS idx_submittals_current_reviewer_id;
-- DROP INDEX IF EXISTS idx_submittals_spec_section;
-- DROP INDEX IF EXISTS idx_submittals_current_stage;
-- DROP INDEX IF EXISTS idx_submittals_status;
-- DROP INDEX IF EXISTS idx_submittals_project_id;
-- DROP TABLE IF EXISTS submittals CASCADE;
-- DROP TYPE IF EXISTS review_stage CASCADE;
-- DROP TYPE IF EXISTS submittal_status CASCADE;
-- DROP TYPE IF EXISTS submittal_type CASCADE;
