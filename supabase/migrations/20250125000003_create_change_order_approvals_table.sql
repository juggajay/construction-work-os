-- Migration: Create Change Order Approvals Table
-- Created: 2025-01-25
-- Description: Multi-stage approval workflow tracking

-- ============================================================================
-- CHANGE ORDER APPROVALS TABLE
-- ============================================================================

CREATE TABLE change_order_approvals (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to change orders
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,

  -- Version tracking (approvals tied to specific versions)
  version INTEGER NOT NULL DEFAULT 1,

  -- Approval stage (GC → Owner → Architect)
  stage approval_stage NOT NULL,

  -- Approver (can be individual user or organization-level)
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Individual approver (nullable for org-level)
  approver_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- Organization approver (for external parties)

  -- Approval decision
  status approval_status NOT NULL DEFAULT 'pending',
  decision_at TIMESTAMPTZ, -- When decision was made
  notes TEXT, -- Approval notes or rejection reason

  -- Standard timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT approval_has_approver CHECK (
    approver_id IS NOT NULL OR approver_org_id IS NOT NULL
  ),
  CONSTRAINT decision_timestamp_set_when_not_pending CHECK (
    (status = 'pending' AND decision_at IS NULL) OR
    (status != 'pending' AND decision_at IS NOT NULL)
  ),
  CONSTRAINT unique_stage_per_version UNIQUE (change_order_id, version, stage)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup by change order
CREATE INDEX idx_approvals_change_order_id
  ON change_order_approvals(change_order_id);

-- Version filtering
CREATE INDEX idx_approvals_change_order_version
  ON change_order_approvals(change_order_id, version);

-- Stage filtering
CREATE INDEX idx_approvals_stage
  ON change_order_approvals(change_order_id, version, stage);

-- Status filtering (for finding pending approvals)
CREATE INDEX idx_approvals_status
  ON change_order_approvals(status)
  WHERE status = 'pending';

-- Approver lookup (find all approvals assigned to a user)
CREATE INDEX idx_approvals_approver_id
  ON change_order_approvals(approver_id)
  WHERE approver_id IS NOT NULL AND status = 'pending';

-- Organization approver lookup
CREATE INDEX idx_approvals_approver_org_id
  ON change_order_approvals(approver_org_id)
  WHERE approver_org_id IS NOT NULL AND status = 'pending';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER approvals_updated_at
  BEFORE UPDATE ON change_order_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- FUNCTION TO AUTO-ADVANCE APPROVAL STAGES
-- ============================================================================

-- This function automatically creates the next approval stage
-- when the current stage is approved
CREATE OR REPLACE FUNCTION advance_approval_stage()
RETURNS TRIGGER AS $$
DECLARE
  v_next_stage approval_stage;
  v_project_id UUID;
  v_project_settings JSONB;
  v_skip_architect BOOLEAN := FALSE;
BEGIN
  -- Only proceed if status changed to 'approved'
  IF NEW.status != 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  -- Get project settings to check if architect approval is required
  SELECT p.id, p.settings INTO v_project_id, v_project_settings
  FROM change_orders co
  JOIN projects p ON p.id = co.project_id
  WHERE co.id = NEW.change_order_id;

  -- Check if architect approval should be skipped
  v_skip_architect := COALESCE((v_project_settings->>'skip_architect_approval')::BOOLEAN, FALSE);

  -- Determine next stage
  IF NEW.stage = 'gc_review' THEN
    v_next_stage := 'owner_approval';
  ELSIF NEW.stage = 'owner_approval' AND NOT v_skip_architect THEN
    v_next_stage := 'architect_approval';
  ELSE
    -- No more stages, mark change order as approved
    UPDATE change_orders
    SET status = 'approved',
        approved_at = now(),
        updated_at = now()
    WHERE id = NEW.change_order_id;

    RETURN NEW;
  END IF;

  -- Create next approval stage
  INSERT INTO change_order_approvals (
    change_order_id,
    version,
    stage,
    status,
    created_at
  ) VALUES (
    NEW.change_order_id,
    NEW.version,
    v_next_stage,
    'pending',
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to advance approval stages
CREATE TRIGGER advance_approval_stage_trigger
  AFTER UPDATE ON change_order_approvals
  FOR EACH ROW
  EXECUTE FUNCTION advance_approval_stage();

-- ============================================================================
-- FUNCTION TO HANDLE APPROVAL REJECTIONS
-- ============================================================================

-- This function updates the change order status when an approval is rejected
CREATE OR REPLACE FUNCTION handle_approval_rejection()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'rejected'
  IF NEW.status != 'rejected' OR OLD.status = 'rejected' THEN
    RETURN NEW;
  END IF;

  -- Update change order status to rejected
  UPDATE change_orders
  SET status = 'rejected',
      rejected_at = now(),
      updated_at = now()
  WHERE id = NEW.change_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle rejections
CREATE TRIGGER handle_approval_rejection_trigger
  AFTER UPDATE ON change_order_approvals
  FOR EACH ROW
  EXECUTE FUNCTION handle_approval_rejection();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE change_order_approvals IS 'Multi-stage approval workflow for change orders';
COMMENT ON COLUMN change_order_approvals.stage IS 'Approval stage: gc_review, owner_approval, architect_approval';
COMMENT ON COLUMN change_order_approvals.approver_id IS 'Individual user approver (nullable for org-level approvals)';
COMMENT ON COLUMN change_order_approvals.approver_org_id IS 'Organization approver (for external parties like architects)';
COMMENT ON COLUMN change_order_approvals.notes IS 'Approval notes or rejection reason';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- To rollback this migration:
-- DROP TRIGGER IF EXISTS handle_approval_rejection_trigger ON change_order_approvals;
-- DROP TRIGGER IF EXISTS advance_approval_stage_trigger ON change_order_approvals;
-- DROP TRIGGER IF EXISTS approvals_updated_at ON change_order_approvals;
-- DROP FUNCTION IF EXISTS handle_approval_rejection();
-- DROP FUNCTION IF EXISTS advance_approval_stage();
-- DROP TABLE IF EXISTS change_order_approvals CASCADE;
