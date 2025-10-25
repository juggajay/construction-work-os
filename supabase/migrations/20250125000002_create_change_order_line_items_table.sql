-- Migration: Create Change Order Line Items Table
-- Created: 2025-01-25
-- Description: Detailed cost breakdowns for change orders

-- ============================================================================
-- CHANGE ORDER LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE change_order_line_items (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to change orders
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,

  -- Version tracking (for negotiations)
  version INTEGER NOT NULL DEFAULT 1,

  -- CSI MasterFormat section
  csi_section TEXT, -- e.g., "03 30 00" for Cast-in-Place Concrete

  -- Line item description
  description TEXT NOT NULL,

  -- Quantity and unit
  quantity DECIMAL(15, 4) DEFAULT 1, -- Support fractional quantities
  unit TEXT, -- e.g., "CY", "SF", "EA", "LF"

  -- Pricing breakdown
  sub_cost DECIMAL(15, 2) DEFAULT 0,           -- Subcontractor cost
  gc_markup_percent DECIMAL(5, 2) DEFAULT 0,   -- GC markup percentage (e.g., 15.00 for 15%)
  gc_markup_amount DECIMAL(15, 2) DEFAULT 0,   -- Computed: sub_cost * gc_markup_percent / 100
  unit_cost DECIMAL(15, 2) DEFAULT 0,          -- Unit cost (can be entered directly or computed from sub_cost + markup)
  extended_cost DECIMAL(15, 2) DEFAULT 0,      -- Computed: quantity * unit_cost

  -- Tax
  tax_rate DECIMAL(5, 2) DEFAULT 0,     -- Tax rate percentage (e.g., 8.50 for 8.5%)
  tax_amount DECIMAL(15, 2) DEFAULT 0,  -- Computed: extended_cost * tax_rate / 100

  -- Total
  total_amount DECIMAL(15, 2) DEFAULT 0, -- Computed: extended_cost + tax_amount

  -- Display order
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Standard timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT quantity_positive CHECK (quantity >= 0),
  CONSTRAINT sub_cost_non_negative CHECK (sub_cost >= 0),
  CONSTRAINT gc_markup_percent_reasonable CHECK (gc_markup_percent BETWEEN 0 AND 100),
  CONSTRAINT gc_markup_amount_non_negative CHECK (gc_markup_amount >= 0),
  CONSTRAINT unit_cost_reasonable CHECK (unit_cost BETWEEN -1000000 AND 1000000),
  CONSTRAINT tax_rate_reasonable CHECK (tax_rate BETWEEN 0 AND 50),
  CONSTRAINT sort_order_non_negative CHECK (sort_order >= 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup by change order
CREATE INDEX idx_line_items_change_order_id
  ON change_order_line_items(change_order_id);

-- Version filtering
CREATE INDEX idx_line_items_change_order_version
  ON change_order_line_items(change_order_id, version);

-- CSI section grouping
CREATE INDEX idx_line_items_csi_section
  ON change_order_line_items(csi_section)
  WHERE csi_section IS NOT NULL;

-- Sort order
CREATE INDEX idx_line_items_sort_order
  ON change_order_line_items(change_order_id, sort_order);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER line_items_updated_at
  BEFORE UPDATE ON change_order_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- FUNCTIONS FOR COMPUTED COLUMNS
-- ============================================================================

-- Function to recalculate line item costs
-- This is called by triggers to keep computed fields in sync
CREATE OR REPLACE FUNCTION calculate_line_item_costs()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate GC markup amount if percentage is set
  IF NEW.gc_markup_percent > 0 AND NEW.sub_cost > 0 THEN
    NEW.gc_markup_amount := ROUND(NEW.sub_cost * NEW.gc_markup_percent / 100, 2);
  END IF;

  -- Calculate unit cost if using sub_cost + markup model
  IF NEW.sub_cost > 0 THEN
    NEW.unit_cost := NEW.sub_cost + NEW.gc_markup_amount;
  END IF;

  -- Calculate extended cost
  NEW.extended_cost := ROUND(NEW.quantity * NEW.unit_cost, 2);

  -- Calculate tax amount
  NEW.tax_amount := ROUND(NEW.extended_cost * NEW.tax_rate / 100, 2);

  -- Calculate total amount
  NEW.total_amount := NEW.extended_cost + NEW.tax_amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate costs on insert/update
CREATE TRIGGER calculate_line_item_costs_trigger
  BEFORE INSERT OR UPDATE ON change_order_line_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_line_item_costs();

-- ============================================================================
-- FUNCTION TO RECALCULATE CHANGE ORDER COST_IMPACT
-- ============================================================================

-- This function recalculates the change_orders.cost_impact field
-- based on the sum of all line items for the current version
CREATE OR REPLACE FUNCTION recalculate_change_order_cost_impact()
RETURNS TRIGGER AS $$
DECLARE
  v_change_order_id UUID;
  v_current_version INTEGER;
  v_total_cost DECIMAL(15, 2);
BEGIN
  -- Determine change_order_id from INSERT/UPDATE/DELETE
  IF TG_OP = 'DELETE' THEN
    v_change_order_id := OLD.change_order_id;
  ELSE
    v_change_order_id := NEW.change_order_id;
  END IF;

  -- Get current version for this change order
  SELECT current_version INTO v_current_version
  FROM change_orders
  WHERE id = v_change_order_id;

  -- Calculate total cost for current version
  SELECT COALESCE(SUM(total_amount), 0) INTO v_total_cost
  FROM change_order_line_items
  WHERE change_order_id = v_change_order_id
    AND version = v_current_version;

  -- Update change_orders.cost_impact
  UPDATE change_orders
  SET cost_impact = v_total_cost,
      updated_at = now()
  WHERE id = v_change_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate cost_impact when line items change
CREATE TRIGGER recalculate_cost_impact_on_line_item_change
  AFTER INSERT OR UPDATE OR DELETE ON change_order_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_change_order_cost_impact();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE change_order_line_items IS 'Detailed cost breakdowns for change orders with CSI sections';
COMMENT ON COLUMN change_order_line_items.version IS 'Tracks which version of the change order this line item belongs to';
COMMENT ON COLUMN change_order_line_items.csi_section IS 'CSI MasterFormat section (e.g., 03 30 00)';
COMMENT ON COLUMN change_order_line_items.sub_cost IS 'Subcontractor cost (before GC markup)';
COMMENT ON COLUMN change_order_line_items.gc_markup_percent IS 'GC markup percentage (e.g., 15.00 for 15%)';
COMMENT ON COLUMN change_order_line_items.gc_markup_amount IS 'Computed GC markup amount';
COMMENT ON COLUMN change_order_line_items.extended_cost IS 'Computed: quantity * unit_cost';
COMMENT ON COLUMN change_order_line_items.tax_amount IS 'Computed: extended_cost * tax_rate / 100';
COMMENT ON COLUMN change_order_line_items.total_amount IS 'Computed: extended_cost + tax_amount';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- To rollback this migration:
-- DROP TRIGGER IF EXISTS recalculate_cost_impact_on_line_item_change ON change_order_line_items;
-- DROP TRIGGER IF EXISTS calculate_line_item_costs_trigger ON change_order_line_items;
-- DROP TRIGGER IF EXISTS line_items_updated_at ON change_order_line_items;
-- DROP FUNCTION IF EXISTS recalculate_change_order_cost_impact();
-- DROP FUNCTION IF EXISTS calculate_line_item_costs();
-- DROP TABLE IF EXISTS change_order_line_items CASCADE;
