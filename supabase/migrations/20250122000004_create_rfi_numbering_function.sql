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
