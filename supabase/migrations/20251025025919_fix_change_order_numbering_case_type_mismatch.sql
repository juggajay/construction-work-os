-- Migration: Fix Change Order Numbering CASE Type Mismatch
-- Created: 2025-10-25
-- Description: Fix "argument of CASE/WHEN must be type boolean" error by casting enum to text

-- ============================================================================
-- FIX SEQUENTIAL NUMBERING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_co_number(
  p_project_id UUID,
  p_status change_order_status
)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_next_number INTEGER;
  v_formatted_number TEXT;
BEGIN
  -- Determine prefix based on status (cast enum to text for comparison)
  CASE p_status::text
    WHEN 'contemplated' THEN
      v_prefix := 'PCO';
    WHEN 'potential' THEN
      v_prefix := 'PCO';
    WHEN 'proposed' THEN
      v_prefix := 'COR';
    WHEN 'rejected' THEN
      v_prefix := 'COR';
    WHEN 'approved' THEN
      v_prefix := 'CO';
    WHEN 'invoiced' THEN
      v_prefix := 'CO';
    ELSE
      v_prefix := 'CO';
  END CASE;

  -- Get the next number for this prefix within the project
  SELECT COALESCE(MAX(
    CASE
      WHEN number ~ ('^' || v_prefix || '-[0-9]+$') THEN
        CAST(SUBSTRING(number FROM '\d+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO v_next_number
  FROM change_orders
  WHERE project_id = p_project_id
    AND number LIKE v_prefix || '-%';

  -- Format the number with leading zeros (e.g., "CO-001")
  v_formatted_number := v_prefix || '-' || LPAD(v_next_number::TEXT, 3, '0');

  RETURN v_formatted_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIX UPDATE NUMBER ON STATUS CHANGE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_co_number_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_prefix TEXT;
  v_new_prefix TEXT;
  v_number_suffix TEXT;
BEGIN
  -- Only proceed if status changed
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Extract current prefix
  v_old_prefix := SPLIT_PART(NEW.number, '-', 1);

  -- Determine new prefix based on new status (cast enum to text for comparison)
  CASE NEW.status::text
    WHEN 'contemplated' THEN
      v_new_prefix := 'PCO';
    WHEN 'potential' THEN
      v_new_prefix := 'PCO';
    WHEN 'proposed' THEN
      v_new_prefix := 'COR';
    WHEN 'rejected' THEN
      v_new_prefix := 'COR';
    WHEN 'approved' THEN
      v_new_prefix := 'CO';
    WHEN 'invoiced' THEN
      v_new_prefix := 'CO';
    ELSE
      v_new_prefix := v_old_prefix;
  END CASE;

  -- If prefix needs to change, update the number
  IF v_new_prefix != v_old_prefix THEN
    v_number_suffix := SPLIT_PART(NEW.number, '-', 2);
    NEW.number := v_new_prefix || '-' || v_number_suffix;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_next_co_number(UUID, change_order_status) IS 'Generate next sequential CO number (CO-001, PCO-001, COR-001) - Fixed CASE type mismatch';
COMMENT ON FUNCTION update_co_number_on_status_change() IS 'Update CO number prefix when status changes (PCO→COR→CO) - Fixed CASE type mismatch';
