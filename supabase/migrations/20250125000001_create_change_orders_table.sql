-- Migration: Create Change Orders Table
-- Created: 2025-01-25
-- Description: Main change_orders table for contract modifications

-- ============================================================================
-- CHANGE ORDERS TABLE
-- ============================================================================

CREATE TABLE change_orders (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Sequential numbering (assigned by function)
  -- Format: "CO-001", "PCO-001", "COR-001" based on status
  number TEXT NOT NULL,

  -- Basic information
  title TEXT NOT NULL,
  description TEXT,

  -- Categorization
  type change_order_type NOT NULL,
  status change_order_status NOT NULL DEFAULT 'contemplated',

  -- Originating event (polymorphic reference)
  originating_event_type originating_event_type,
  originating_event_id UUID, -- References rfi.id, submittal.id, or daily_report.id

  -- Financial impact
  cost_impact DECIMAL(15, 2) DEFAULT 0, -- Total cost change (can be negative for deductive COs)

  -- Schedule impact
  schedule_impact_days INTEGER DEFAULT 0, -- Days added (positive) or deducted (negative)
  new_completion_date DATE, -- Updated project completion date (if applicable)

  -- Versioning (for negotiations and revisions)
  current_version INTEGER NOT NULL DEFAULT 1,

  -- Ownership and tracking
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Status timestamps
  submitted_at TIMESTAMPTZ, -- When promoted to 'proposed'
  approved_at TIMESTAMPTZ,  -- When fully approved
  rejected_at TIMESTAMPTZ,  -- When rejected
  invoiced_at TIMESTAMPTZ,  -- When billing complete

  -- Custom fields (per-org flexibility)
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- Standard timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Constraints
  CONSTRAINT unique_co_number_per_project UNIQUE (project_id, number),
  CONSTRAINT cost_impact_reasonable CHECK (cost_impact BETWEEN -10000000 AND 10000000),
  CONSTRAINT schedule_impact_reasonable CHECK (schedule_impact_days BETWEEN -365 AND 365),
  CONSTRAINT current_version_positive CHECK (current_version > 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary query indexes (project scoping + filtering)
CREATE INDEX idx_change_orders_project_id
  ON change_orders(project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_change_orders_project_status
  ON change_orders(project_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_change_orders_project_type
  ON change_orders(project_id, type)
  WHERE deleted_at IS NULL;

-- Originating event lookup
CREATE INDEX idx_change_orders_originating_event
  ON change_orders(originating_event_type, originating_event_id)
  WHERE originating_event_id IS NOT NULL AND deleted_at IS NULL;

-- Number lookup (for search)
CREATE INDEX idx_change_orders_number
  ON change_orders(project_id, number)
  WHERE deleted_at IS NULL;

-- Creator lookup
CREATE INDEX idx_change_orders_created_by
  ON change_orders(created_by)
  WHERE deleted_at IS NULL;

-- Status timestamp indexes (for reporting)
CREATE INDEX idx_change_orders_submitted_at
  ON change_orders(submitted_at DESC)
  WHERE submitted_at IS NOT NULL;

CREATE INDEX idx_change_orders_approved_at
  ON change_orders(approved_at DESC)
  WHERE approved_at IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER change_orders_updated_at
  BEFORE UPDATE ON change_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE change_orders IS 'Change orders for tracking contract modifications (scope, cost, schedule)';
COMMENT ON COLUMN change_orders.number IS 'Sequential number: CO-001 (approved), PCO-001 (potential), COR-001 (proposed)';
COMMENT ON COLUMN change_orders.cost_impact IS 'Total cost change including all line items and tax (negative for deductive COs)';
COMMENT ON COLUMN change_orders.schedule_impact_days IS 'Days added (positive) or deducted (negative) from schedule';
COMMENT ON COLUMN change_orders.current_version IS 'Version number for tracking negotiations and revisions';
COMMENT ON COLUMN change_orders.originating_event_type IS 'Type of event that triggered this change order (rfi, submittal, daily_report, manual)';
COMMENT ON COLUMN change_orders.originating_event_id IS 'ID of the originating event (polymorphic reference)';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- To rollback this migration:
-- DROP TRIGGER IF EXISTS change_orders_updated_at ON change_orders;
-- DROP TABLE IF EXISTS change_orders CASCADE;
