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
