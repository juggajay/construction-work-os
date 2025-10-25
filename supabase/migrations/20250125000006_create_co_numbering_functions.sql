-- Migration: Create Change Order Sequential Numbering Functions
-- Created: 2025-01-25
-- Description: Auto-generate CO numbers based on project and status

-- ============================================================================
-- SEQUENTIAL NUMBERING FUNCTION
-- ============================================================================

-- This function generates the next sequential change order number
-- Format: "CO-001", "PCO-001", "COR-001" based on status
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
  -- Determine prefix based on status
  CASE p_status
    WHEN 'contemplated', 'potential' THEN
      v_prefix := 'PCO'; -- Potential Change Order
    WHEN 'proposed', 'rejected' THEN
      v_prefix := 'COR'; -- Change Order Request
    WHEN 'approved', 'invoiced' THEN
      v_prefix := 'CO'; -- Change Order
    ELSE
      v_prefix := 'CO'; -- Default
  END CASE;

  -- Get the next number for this prefix within the project
  SELECT COALESCE(MAX(
    CASE
      WHEN number ~ '^' || v_prefix || '-[0-9]+$' THEN
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
-- TRIGGER FUNCTION TO AUTO-ASSIGN NUMBER ON INSERT
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_assign_co_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign number if not already set
  IF NEW.number IS NULL OR NEW.number = '' THEN
    NEW.number := get_next_co_number(NEW.project_id, NEW.status);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign number on insert
CREATE TRIGGER auto_assign_co_number_trigger
  BEFORE INSERT ON change_orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_co_number();

-- ============================================================================
-- FUNCTION TO UPDATE NUMBER WHEN STATUS CHANGES
-- ============================================================================

-- When a change order's status changes, we may need to update its number
-- Example: PCO-001 becomes COR-001 when submitted, COR-001 becomes CO-001 when approved
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

  -- Determine new prefix based on new status
  CASE NEW.status
    WHEN 'contemplated', 'potential' THEN
      v_new_prefix := 'PCO';
    WHEN 'proposed', 'rejected' THEN
      v_new_prefix := 'COR';
    WHEN 'approved', 'invoiced' THEN
      v_new_prefix := 'CO';
    ELSE
      v_new_prefix := v_old_prefix; -- Keep existing prefix
  END CASE;

  -- If prefix needs to change, update the number
  IF v_new_prefix != v_old_prefix THEN
    v_number_suffix := SPLIT_PART(NEW.number, '-', 2);
    NEW.number := v_new_prefix || '-' || v_number_suffix;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update number on status change
CREATE TRIGGER update_co_number_on_status_change_trigger
  BEFORE UPDATE ON change_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_co_number_on_status_change();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_next_co_number(UUID, change_order_status) IS 'Generate next sequential CO number (CO-001, PCO-001, COR-001)';
COMMENT ON FUNCTION auto_assign_co_number() IS 'Auto-assign CO number on insert';
COMMENT ON FUNCTION update_co_number_on_status_change() IS 'Update CO number prefix when status changes (PCO→COR→CO)';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- DROP TRIGGER IF EXISTS update_co_number_on_status_change_trigger ON change_orders;
-- DROP TRIGGER IF EXISTS auto_assign_co_number_trigger ON change_orders;
-- DROP FUNCTION IF EXISTS update_co_number_on_status_change();
-- DROP FUNCTION IF EXISTS auto_assign_co_number();
-- DROP FUNCTION IF EXISTS get_next_co_number(UUID, change_order_status);
