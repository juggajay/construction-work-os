-- RFI Module: Core RFIs Table
-- This migration creates the main rfis table with all columns, constraints, and indexes

-- ============================================================================
-- TABLE: rfis
-- ============================================================================

CREATE TABLE rfis (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT NOT NULL, -- Auto-generated: "RFI-001", "RFI-002", etc.

  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discipline TEXT, -- "structural", "mechanical", "electrical", etc.
  spec_section TEXT, -- CSI MasterFormat: "03 30 00 - Cast-in-Place Concrete"
  drawing_reference TEXT, -- Comma-separated sheet numbers: "A-101, A-102"

  -- Status & Workflow
  status rfi_status NOT NULL DEFAULT 'draft',
  priority rfi_priority NOT NULL DEFAULT 'medium',

  -- Assignment (Ball-in-court tracking)
  assigned_to_id UUID REFERENCES profiles(id), -- Individual user assignment
  assigned_to_org UUID REFERENCES organizations(id), -- External A/E firm assignment
  created_by UUID NOT NULL REFERENCES profiles(id),

  -- Timestamps & SLA Tracking
  submitted_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  response_due_date TIMESTAMPTZ,
  overdue_at TIMESTAMPTZ, -- Cached for fast overdue queries
  answered_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Impact Tracking
  cost_impact NUMERIC(12,2), -- Estimated $ impact
  schedule_impact INTEGER, -- Estimated days delay

  -- Extensibility
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(project_id, number), -- Sequential numbering per project
  CHECK (
    (assigned_to_id IS NULL AND assigned_to_org IS NOT NULL) OR
    (assigned_to_id IS NOT NULL AND assigned_to_org IS NULL) OR
    (assigned_to_id IS NULL AND assigned_to_org IS NULL)
  ) -- Can assign to user XOR org, not both
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary query: Get all RFIs for a project
CREATE INDEX idx_rfis_project_id ON rfis(project_id) WHERE deleted_at IS NULL;

-- Filter by status
CREATE INDEX idx_rfis_status ON rfis(status) WHERE deleted_at IS NULL;

-- Filter by assignee (for "My RFIs" view)
CREATE INDEX idx_rfis_assigned_to_id ON rfis(assigned_to_id) WHERE deleted_at IS NULL;

-- Overdue RFI dashboard query
CREATE INDEX idx_rfis_overdue
  ON rfis(overdue_at, project_id)
  WHERE overdue_at IS NOT NULL
    AND status NOT IN ('closed', 'cancelled')
    AND deleted_at IS NULL;

-- Analytics: Response time by discipline
CREATE INDEX idx_rfis_discipline ON rfis(discipline) WHERE deleted_at IS NULL;

-- Composite index for common list queries (project + status + created date)
CREATE INDEX idx_rfis_project_status_created
  ON rfis(project_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Full-text search on title + description
CREATE INDEX idx_rfis_search
  ON rfis
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rfis_updated_at
  BEFORE UPDATE ON rfis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE rfis IS 'Requests for Information (RFIs) for construction project clarifications';
COMMENT ON COLUMN rfis.number IS 'Sequential number per project (e.g., RFI-001)';
COMMENT ON COLUMN rfis.status IS 'Current workflow status: draft → submitted → under_review → answered → closed';
COMMENT ON COLUMN rfis.assigned_to_id IS 'User who must respond (ball-in-court) - XOR with assigned_to_org';
COMMENT ON COLUMN rfis.assigned_to_org IS 'Organization assigned to respond (for external A/E) - XOR with assigned_to_id';
COMMENT ON COLUMN rfis.overdue_at IS 'Cached timestamp for when RFI becomes overdue (for fast queries)';
COMMENT ON COLUMN rfis.spec_section IS 'CSI MasterFormat specification section (e.g., "03 30 00")';
COMMENT ON COLUMN rfis.drawing_reference IS 'Comma-separated drawing sheet numbers (e.g., "A-101, S-201")';
