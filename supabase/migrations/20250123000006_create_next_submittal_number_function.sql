-- Migration: Create Next Submittal Number Function
-- Created: 2025-01-23
-- Task: 1.6 - Create Sequential Numbering Function per Spec Section
-- Purpose: Generate unique sequential submittal numbers per project and CSI spec section

-- UP Migration

-- Create function to generate next submittal number
-- Format: "{spec_section}-{###}" (e.g., "03 30 00-001")
-- Numbering is independent per project and spec section
CREATE OR REPLACE FUNCTION next_submittal_number(
  p_project_id UUID,
  p_spec_section TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_number INTEGER;
  v_formatted_number TEXT;
BEGIN
  -- Validate inputs
  IF p_project_id IS NULL THEN
    RAISE EXCEPTION 'project_id cannot be null';
  END IF;

  IF p_spec_section IS NULL OR p_spec_section = '' THEN
    RAISE EXCEPTION 'spec_section cannot be null or empty';
  END IF;

  -- Lock table to prevent race conditions during number generation
  -- Find the highest existing number for this project and spec section
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(number FROM '[0-9]+$')
      AS INTEGER
    )
  ), 0) + 1
  INTO v_next_number
  FROM submittals
  WHERE project_id = p_project_id
    AND spec_section = p_spec_section
    AND deleted_at IS NULL
  FOR UPDATE;  -- Lock rows to prevent concurrent inserts

  -- Format number with leading zeros (001, 002, etc.)
  v_formatted_number := p_spec_section || '-' || LPAD(v_next_number::TEXT, 3, '0');

  RETURN v_formatted_number;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION next_submittal_number(UUID, TEXT) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION next_submittal_number IS 'Generate next sequential submittal number for a project and CSI spec section (e.g., "03 30 00-001")';

-- DOWN Migration (Rollback)
-- REVOKE EXECUTE ON FUNCTION next_submittal_number(UUID, TEXT) FROM authenticated;
-- DROP FUNCTION IF EXISTS next_submittal_number(UUID, TEXT);
