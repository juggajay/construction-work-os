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
