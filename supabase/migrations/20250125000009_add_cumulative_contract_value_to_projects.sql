-- Migration: Add Cumulative Contract Value to Projects
-- Created: 2025-01-25
-- Description: Add field to track project contract value including change orders

-- ============================================================================
-- ADD COLUMN TO PROJECTS TABLE
-- ============================================================================

-- Add cumulative_contract_value field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'cumulative_contract_value'
  ) THEN
    ALTER TABLE projects
    ADD COLUMN cumulative_contract_value DECIMAL(15, 2) DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- INDEX FOR CUMULATIVE CONTRACT VALUE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_cumulative_contract_value
  ON projects(cumulative_contract_value)
  WHERE cumulative_contract_value > 0;

-- ============================================================================
-- FUNCTION TO UPDATE CUMULATIVE CONTRACT VALUE
-- ============================================================================

-- This function updates the project's cumulative contract value
-- when a change order is approved or cancelled
CREATE OR REPLACE FUNCTION update_cumulative_contract_value()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle approval (add to cumulative value)
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE projects
    SET cumulative_contract_value = COALESCE(cumulative_contract_value, 0) + NEW.cost_impact,
        updated_at = now()
    WHERE id = NEW.project_id;

  -- Handle un-approval or cancellation (subtract from cumulative value)
  ELSIF OLD.status = 'approved' AND NEW.status IN ('cancelled', 'rejected') THEN
    UPDATE projects
    SET cumulative_contract_value = COALESCE(cumulative_contract_value, 0) - OLD.cost_impact,
        updated_at = now()
    WHERE id = NEW.project_id;

  -- Handle cost_impact change on approved change order (recalculate)
  ELSIF NEW.status = 'approved' AND OLD.status = 'approved' AND NEW.cost_impact != OLD.cost_impact THEN
    UPDATE projects
    SET cumulative_contract_value = COALESCE(cumulative_contract_value, 0) - OLD.cost_impact + NEW.cost_impact,
        updated_at = now()
    WHERE id = NEW.project_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update cumulative contract value
CREATE TRIGGER update_cumulative_contract_value_trigger
  AFTER INSERT OR UPDATE ON change_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_cumulative_contract_value();

-- ============================================================================
-- FUNCTION TO RECALCULATE CUMULATIVE CONTRACT VALUE (for reconciliation)
-- ============================================================================

-- This function recalculates cumulative contract value from scratch
-- Useful for periodic reconciliation or recovery from errors
CREATE OR REPLACE FUNCTION recalculate_cumulative_contract_value(p_project_id UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_total DECIMAL(15, 2);
BEGIN
  -- Sum all approved change orders
  SELECT COALESCE(SUM(cost_impact), 0) INTO v_total
  FROM change_orders
  WHERE project_id = p_project_id
    AND status = 'approved'
    AND deleted_at IS NULL;

  -- Update project
  UPDATE projects
  SET cumulative_contract_value = v_total,
      updated_at = now()
  WHERE id = p_project_id;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN projects.cumulative_contract_value IS 'Sum of all approved change orders (updated by trigger)';
COMMENT ON FUNCTION update_cumulative_contract_value() IS 'Automatically updates project cumulative contract value when change orders are approved/cancelled';
COMMENT ON FUNCTION recalculate_cumulative_contract_value(UUID) IS 'Recalculates cumulative contract value from scratch (for reconciliation)';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- DROP TRIGGER IF EXISTS update_cumulative_contract_value_trigger ON change_orders;
-- DROP FUNCTION IF EXISTS recalculate_cumulative_contract_value(UUID);
-- DROP FUNCTION IF EXISTS update_cumulative_contract_value();
-- DROP INDEX IF EXISTS idx_projects_cumulative_contract_value;
-- ALTER TABLE projects DROP COLUMN IF EXISTS cumulative_contract_value;
