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
