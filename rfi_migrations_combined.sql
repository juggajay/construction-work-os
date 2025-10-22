-- RFI Module: Enums
-- This migration creates enum types for RFI status and priority

-- ============================================================================
-- ENUMS
-- ============================================================================

-- RFI status workflow
CREATE TYPE rfi_status AS ENUM (
  'draft',        -- Creator is working on RFI, not yet submitted
  'submitted',    -- RFI sent to assignee (ball-in-court transfers)
  'under_review', -- Assignee is investigating/drafting response
  'answered',     -- Official response provided, awaiting creator to close
  'closed',       -- RFI resolved, no further action
  'cancelled'     -- RFI cancelled (can happen from any status)
);

-- RFI priority levels
CREATE TYPE rfi_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TYPE rfi_status IS 'RFI workflow states following the status state machine';
COMMENT ON TYPE rfi_priority IS 'Priority levels for RFI urgency and scheduling';
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
-- RFI Module: RFI Responses Table
-- This migration creates the rfi_responses table for threaded conversations

-- ============================================================================
-- TABLE: rfi_responses
-- ============================================================================

CREATE TABLE rfi_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_official_answer BOOLEAN NOT NULL DEFAULT false, -- Only one per RFI
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Get all responses for an RFI (ordered by created_at)
CREATE INDEX idx_rfi_responses_rfi_id
  ON rfi_responses(rfi_id, created_at ASC);

-- Find the official answer for an RFI (should be at most one)
CREATE INDEX idx_rfi_responses_official
  ON rfi_responses(rfi_id, is_official_answer)
  WHERE is_official_answer = true;

-- Query responses by author (for activity tracking)
CREATE INDEX idx_rfi_responses_author
  ON rfi_responses(author_id, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER rfi_responses_updated_at
  BEFORE UPDATE ON rfi_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE rfi_responses IS 'Threaded conversation responses on RFIs';
COMMENT ON COLUMN rfi_responses.is_official_answer IS 'Only one response per RFI can be marked as the official answer';
COMMENT ON COLUMN rfi_responses.content IS 'Response text content (supports markdown)';
-- RFI Module: RFI Attachments Table
-- This migration creates the rfi_attachments table for file uploads

-- ============================================================================
-- TABLE: rfi_attachments
-- ============================================================================

CREATE TABLE rfi_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
  response_id UUID REFERENCES rfi_responses(id) ON DELETE CASCADE, -- Nullable: attachments can be at RFI or response level
  file_path TEXT NOT NULL, -- Supabase Storage path: /rfis/{project_id}/{rfi_id}/{filename}
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- Size in bytes
  file_type TEXT NOT NULL, -- MIME type (e.g., "application/pdf", "image/jpeg")
  drawing_sheet TEXT, -- Optional: If referencing an existing drawing sheet (e.g., "A-101")
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Get all attachments for an RFI
CREATE INDEX idx_rfi_attachments_rfi_id
  ON rfi_attachments(rfi_id, created_at ASC);

-- Get all attachments for a specific response
CREATE INDEX idx_rfi_attachments_response_id
  ON rfi_attachments(response_id, created_at ASC)
  WHERE response_id IS NOT NULL;

-- Query attachments by uploader (for quota tracking)
CREATE INDEX idx_rfi_attachments_uploaded_by
  ON rfi_attachments(uploaded_by, created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE rfi_attachments IS 'File attachments for RFIs (photos, PDFs, documents)';
COMMENT ON COLUMN rfi_attachments.file_path IS 'Supabase Storage path relative to rfis bucket';
COMMENT ON COLUMN rfi_attachments.file_size IS 'File size in bytes (max 10MB enforced in application)';
COMMENT ON COLUMN rfi_attachments.file_type IS 'MIME type (validated: PDF, JPG, PNG, DOCX, XLSX)';
COMMENT ON COLUMN rfi_attachments.response_id IS 'If set, attachment belongs to a response; otherwise belongs to RFI root';
COMMENT ON COLUMN rfi_attachments.drawing_sheet IS 'Optional reference to existing drawing sheet number';
-- RFI Module: Sequential Numbering Function
-- This migration creates the next_rfi_number() function with row locking to prevent race conditions

-- ============================================================================
-- FUNCTION: next_rfi_number
-- ============================================================================

CREATE OR REPLACE FUNCTION next_rfi_number(p_project_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_num INTEGER;
  v_number TEXT;
BEGIN
  -- Lock the project row to prevent concurrent RFI creation from generating duplicate numbers
  PERFORM 1 FROM projects WHERE id = p_project_id FOR UPDATE;

  -- Get the highest existing number for this project
  -- Extract numeric part from "RFI-001" format, find max, add 1
  SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM 'RFI-(\d+)') AS INTEGER)), 0) + 1
  INTO v_next_num
  FROM rfis
  WHERE project_id = p_project_id
    AND deleted_at IS NULL;

  -- Format as RFI-001, RFI-002, etc. (zero-padded to 3 digits)
  v_number := 'RFI-' || LPAD(v_next_num::TEXT, 3, '0');

  RETURN v_number;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION next_rfi_number IS 'Generates next sequential RFI number for a project (e.g., RFI-001, RFI-002). Uses row-level locking to prevent duplicates.';
-- RFI Module: Row Level Security Policies
-- This migration enables RLS and creates policies for rfis, rfi_responses, and rfi_attachments

-- ============================================================================
-- ENABLE RLS ON ALL RFI TABLES
-- ============================================================================

ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: rfis
-- ============================================================================

-- SELECT: Users can view RFIs in projects they have access to
CREATE POLICY "Users can view RFIs in accessible projects"
  ON rfis FOR SELECT
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND deleted_at IS NULL
  );

-- INSERT: Project managers can create RFIs
CREATE POLICY "Project managers can create RFIs"
  ON rfis FOR INSERT
  WITH CHECK (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND is_project_manager(auth.uid(), project_id)
  );

-- UPDATE: Creators and assignees can update RFIs
-- Additional logic: Only draft RFIs can have content edited (enforced in app layer)
CREATE POLICY "Creators and assignees can update RFIs"
  ON rfis FOR UPDATE
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND (
      created_by = auth.uid() OR
      assigned_to_id = auth.uid() OR
      is_project_manager(auth.uid(), project_id)
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND (
      created_by = auth.uid() OR
      assigned_to_id = auth.uid() OR
      is_project_manager(auth.uid(), project_id)
    )
  );

-- DELETE: Project admins can soft-delete RFIs (via org admin status)
CREATE POLICY "Admins can delete RFIs"
  ON rfis FOR DELETE
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = rfis.project_id
        AND is_org_admin(auth.uid(), p.org_id)
    )
  );

-- ============================================================================
-- RLS POLICIES: rfi_responses
-- ============================================================================

-- SELECT: Users can view responses for RFIs they can access
CREATE POLICY "Users can view responses in accessible RFIs"
  ON rfi_responses FOR SELECT
  USING (
    rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  );

-- INSERT: Users can add responses to accessible RFIs
CREATE POLICY "Users can add responses to accessible RFIs"
  ON rfi_responses FOR INSERT
  WITH CHECK (
    rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  );

-- UPDATE: Response authors can edit their own responses (within time limit - enforced in app)
CREATE POLICY "Authors can update own responses"
  ON rfi_responses FOR UPDATE
  USING (
    author_id = auth.uid()
    AND rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    author_id = auth.uid()
  );

-- DELETE: No DELETE policy - responses are immutable once created
-- (Soft deletes can be added later if needed)

-- ============================================================================
-- RLS POLICIES: rfi_attachments
-- ============================================================================

-- SELECT: Users can view attachments for accessible RFIs
CREATE POLICY "Users can view attachments in accessible RFIs"
  ON rfi_attachments FOR SELECT
  USING (
    rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  );

-- INSERT: Users can upload attachments to accessible RFIs
CREATE POLICY "Users can upload attachments to accessible RFIs"
  ON rfi_attachments FOR INSERT
  WITH CHECK (
    rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  );

-- DELETE: Uploaders can delete their own attachments from draft RFIs
-- (Draft status check enforced in application layer)
CREATE POLICY "Uploaders can delete own attachments"
  ON rfi_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view RFIs in accessible projects" ON rfis
  IS 'Users can view RFIs in projects they have access to via organization membership or direct project access';

COMMENT ON POLICY "Project managers can create RFIs" ON rfis
  IS 'Only project managers can create new RFIs in their projects';

COMMENT ON POLICY "Creators and assignees can update RFIs" ON rfis
  IS 'RFI creators, assignees, and project managers can update RFIs. Draft-only editing enforced in app layer.';

COMMENT ON POLICY "Users can view responses in accessible RFIs" ON rfi_responses
  IS 'Users can view responses in RFIs they have access to';

COMMENT ON POLICY "Users can add responses to accessible RFIs" ON rfi_responses
  IS 'Any user with RFI access can add responses (for collaborative clarification)';

COMMENT ON POLICY "Users can view attachments in accessible RFIs" ON rfi_attachments
  IS 'Users can view and download attachments from RFIs they can access';
-- RFI Module: Audit Logging Triggers
-- This migration creates audit triggers for all RFI tables using the existing log_changes() function

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

-- Audit trigger for rfis table
-- Logs all INSERT, UPDATE, and DELETE operations
CREATE TRIGGER rfis_audit
  AFTER INSERT OR UPDATE OR DELETE ON rfis
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Audit trigger for rfi_responses table
-- Logs all INSERT, UPDATE, and DELETE operations
CREATE TRIGGER rfi_responses_audit
  AFTER INSERT OR UPDATE OR DELETE ON rfi_responses
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Audit trigger for rfi_attachments table
-- Logs all INSERT, UPDATE, and DELETE operations
CREATE TRIGGER rfi_attachments_audit
  AFTER INSERT OR UPDATE OR DELETE ON rfi_attachments
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TRIGGER rfis_audit ON rfis
  IS 'Logs all changes to rfis table for audit compliance';

COMMENT ON TRIGGER rfi_responses_audit ON rfi_responses
  IS 'Logs all changes to rfi_responses table for audit compliance';

COMMENT ON TRIGGER rfi_attachments_audit ON rfi_attachments
  IS 'Logs all changes to rfi_attachments table for audit compliance';
