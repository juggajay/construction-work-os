-- Migration: Create Change Order Enums
-- Created: 2025-01-25
-- Description: Create ENUM types for change orders module

-- ============================================================================
-- CHANGE ORDER ENUMS
-- ============================================================================

-- Change order status enum
-- Tracks the lifecycle from contemplation through invoicing
CREATE TYPE change_order_status AS ENUM (
  'contemplated',  -- Initial idea, not yet a formal PCO
  'potential',     -- PCO - Potential Change Order (pricing development)
  'proposed',      -- COR - Change Order Request (submitted for approval)
  'approved',      -- CO - Change Order (fully approved)
  'rejected',      -- Rejected by approver (can be revised and resubmitted)
  'cancelled',     -- Cancelled at any stage (preserves audit trail)
  'invoiced'       -- Billing complete
);

-- Change order type enum
-- Categorizes change orders by cause/nature
CREATE TYPE change_order_type AS ENUM (
  'scope_change',      -- Scope addition or deletion
  'design_change',     -- Architect/engineer design revision
  'site_condition',    -- Unforeseen site condition (soil, utilities, etc.)
  'owner_requested',   -- Owner-initiated change
  'time_extension',    -- Schedule impact only (no cost)
  'cost_only',         -- Cost impact only (no schedule)
  'schedule_only'      -- Schedule impact only (deductive or additive)
);

-- Originating event type enum
-- Links change orders to source events
CREATE TYPE originating_event_type AS ENUM (
  'rfi',           -- Request for Information
  'submittal',     -- Product substitution or upgrade
  'daily_report',  -- Site condition or incident
  'manual'         -- Manually created (no originating event)
);

-- Approval stage enum
-- Multi-stage approval workflow
CREATE TYPE approval_stage AS ENUM (
  'gc_review',          -- General Contractor internal review
  'owner_approval',     -- Owner/client approval
  'architect_approval'  -- Architect/engineer approval (optional)
);

-- Approval status enum
-- Status of each approval stage
CREATE TYPE approval_status AS ENUM (
  'pending',   -- Awaiting decision
  'approved',  -- Approved with optional notes
  'rejected',  -- Rejected with reason
  'skipped'    -- Stage skipped (e.g., architect approval not required)
);

-- Attachment category enum
-- Categorizes supporting documents
CREATE TYPE attachment_category AS ENUM (
  'quote',     -- Subcontractor or vendor quote
  'drawing',   -- Drawing or sketch
  'photo',     -- Photo evidence
  'contract',  -- Signed change order document (AIA G701)
  'other'      -- Miscellaneous
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TYPE change_order_status IS 'Change order lifecycle status';
COMMENT ON TYPE change_order_type IS 'Change order categorization by cause';
COMMENT ON TYPE originating_event_type IS 'Type of event that triggered the change order';
COMMENT ON TYPE approval_stage IS 'Multi-stage approval workflow stages';
COMMENT ON TYPE approval_status IS 'Status of each approval stage';
COMMENT ON TYPE attachment_category IS 'Categories for supporting documents';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- To rollback this migration, drop all enums:
-- DROP TYPE IF EXISTS attachment_category CASCADE;
-- DROP TYPE IF EXISTS approval_status CASCADE;
-- DROP TYPE IF EXISTS approval_stage CASCADE;
-- DROP TYPE IF EXISTS originating_event_type CASCADE;
-- DROP TYPE IF EXISTS change_order_type CASCADE;
-- DROP TYPE IF EXISTS change_order_status CASCADE;
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
-- Migration: Create Change Order Versions Table
-- Created: 2025-01-25
-- Description: Version history for change order negotiations

CREATE TABLE change_order_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL, -- Why this version was created
  cost_impact DECIMAL(15, 2) DEFAULT 0, -- Snapshot of cost at this version
  schedule_impact_days INTEGER DEFAULT 0, -- Snapshot of schedule impact
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_version_per_co UNIQUE (change_order_id, version_number),
  CONSTRAINT version_number_positive CHECK (version_number > 0)
);

CREATE INDEX idx_versions_change_order_id ON change_order_versions(change_order_id);
CREATE INDEX idx_versions_change_order_version ON change_order_versions(change_order_id, version_number);

COMMENT ON TABLE change_order_versions IS 'Version history for change order negotiations and revisions';
COMMENT ON COLUMN change_order_versions.reason IS 'Explanation for why this version was created (e.g., "Owner requested price reduction")';
-- Migration: Create Change Order Attachments Table
-- Created: 2025-01-25
-- Description: Supporting documents for change orders

CREATE TABLE change_order_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- Bytes
  file_type TEXT, -- MIME type
  category attachment_category NOT NULL DEFAULT 'other',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT file_size_reasonable CHECK (file_size > 0 AND file_size <= 52428800) -- Max 50MB
);

CREATE INDEX idx_attachments_change_order_id ON change_order_attachments(change_order_id);
CREATE INDEX idx_attachments_category ON change_order_attachments(change_order_id, category);
CREATE INDEX idx_attachments_uploaded_by ON change_order_attachments(uploaded_by);

COMMENT ON TABLE change_order_attachments IS 'Supporting documents (quotes, drawings, photos, contracts) for change orders';
COMMENT ON COLUMN change_order_attachments.category IS 'Document category: quote, drawing, photo, contract, other';
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
-- Migration: Create RLS Policies for Change Orders
-- Created: 2025-01-25
-- Description: Row-Level Security policies for all change order tables

-- ============================================================================
-- HELPER FUNCTION (if not already exists)
-- ============================================================================

-- Function to get all project IDs accessible by a user
CREATE OR REPLACE FUNCTION user_project_ids()
RETURNS TABLE(project_id UUID) AS $$
  SELECT DISTINCT p.id
  FROM projects p
  INNER JOIN organization_members om ON om.org_id = p.org_id
  WHERE om.user_id = auth.uid()
    AND om.deleted_at IS NULL
  UNION
  SELECT pa.project_id
  FROM project_access pa
  WHERE pa.user_id = auth.uid()
    AND pa.deleted_at IS NULL
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- CHANGE_ORDERS TABLE RLS
-- ============================================================================

ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view change orders for their projects
CREATE POLICY "Users can view change orders for their projects"
  ON change_orders FOR SELECT
  USING (
    project_id IN (SELECT user_project_ids())
  );

-- Policy: Users can create change orders for their projects
CREATE POLICY "Users can create change orders for their projects"
  ON change_orders FOR INSERT
  WITH CHECK (
    project_id IN (SELECT user_project_ids())
    AND created_by = auth.uid()
  );

-- Policy: Creators and project managers can update change orders
CREATE POLICY "Creators and managers can update change orders"
  ON change_orders FOR UPDATE
  USING (
    project_id IN (SELECT user_project_ids())
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_access pa
        WHERE pa.project_id = change_orders.project_id
          AND pa.user_id = auth.uid()
          AND pa.role IN ('manager', 'supervisor')
          AND pa.deleted_at IS NULL
      )
    )
    -- Cannot edit approved or invoiced change orders
    AND status NOT IN ('approved', 'invoiced')
  );

-- Policy: Creators can soft-delete their own change orders (if not submitted)
CREATE POLICY "Creators can delete their draft change orders"
  ON change_orders FOR DELETE
  USING (
    project_id IN (SELECT user_project_ids())
    AND created_by = auth.uid()
    AND status IN ('contemplated', 'potential')
  );

-- ============================================================================
-- CHANGE_ORDER_LINE_ITEMS TABLE RLS
-- ============================================================================

ALTER TABLE change_order_line_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view line items for change orders they can access
CREATE POLICY "Users can view line items for accessible change orders"
  ON change_order_line_items FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
    )
  );

-- Policy: Users can create line items for change orders they can edit
CREATE POLICY "Users can create line items for editable change orders"
  ON change_order_line_items FOR INSERT
  WITH CHECK (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
        AND status NOT IN ('approved', 'invoiced')
    )
  );

-- Policy: Users can update line items for change orders they can edit
CREATE POLICY "Users can update line items for editable change orders"
  ON change_order_line_items FOR UPDATE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
        AND status NOT IN ('approved', 'invoiced')
    )
  );

-- Policy: Users can delete line items for change orders they can edit
CREATE POLICY "Users can delete line items for editable change orders"
  ON change_order_line_items FOR DELETE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
        AND status NOT IN ('approved', 'invoiced')
    )
  );

-- ============================================================================
-- CHANGE_ORDER_APPROVALS TABLE RLS
-- ============================================================================

ALTER TABLE change_order_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view approvals for accessible change orders
CREATE POLICY "Users can view approvals for accessible change orders"
  ON change_order_approvals FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
    )
  );

-- Policy: System can create approval records (approvals are created by triggers)
CREATE POLICY "System can create approval records"
  ON change_order_approvals FOR INSERT
  WITH CHECK (true);

-- Policy: Assigned approvers can update their approval decisions
CREATE POLICY "Approvers can update their approval decisions"
  ON change_order_approvals FOR UPDATE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
    )
    AND (
      approver_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.org_id = change_order_approvals.approver_org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
          AND om.deleted_at IS NULL
      )
      OR EXISTS (
        SELECT 1 FROM project_access pa
        JOIN change_orders co ON co.project_id = pa.project_id
        WHERE co.id = change_order_approvals.change_order_id
          AND pa.user_id = auth.uid()
          AND pa.role = 'manager'
          AND pa.deleted_at IS NULL
      )
    )
    AND status = 'pending' -- Can only update pending approvals
  );

-- ============================================================================
-- CHANGE_ORDER_VERSIONS TABLE RLS
-- ============================================================================

ALTER TABLE change_order_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions for accessible change orders
CREATE POLICY "Users can view versions for accessible change orders"
  ON change_order_versions FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
    )
  );

-- Policy: Users can create versions for change orders they can edit
CREATE POLICY "Users can create versions for editable change orders"
  ON change_order_versions FOR INSERT
  WITH CHECK (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
    )
    AND created_by = auth.uid()
  );

-- ============================================================================
-- CHANGE_ORDER_ATTACHMENTS TABLE RLS
-- ============================================================================

ALTER TABLE change_order_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments for accessible change orders
CREATE POLICY "Users can view attachments for accessible change orders"
  ON change_order_attachments FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
    )
  );

-- Policy: Users can upload attachments for accessible change orders
CREATE POLICY "Users can upload attachments for accessible change orders"
  ON change_order_attachments FOR INSERT
  WITH CHECK (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
    )
    AND uploaded_by = auth.uid()
  );

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
  ON change_order_attachments FOR DELETE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT user_project_ids())
    )
    AND uploaded_by = auth.uid()
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view change orders for their projects" ON change_orders IS 'Users can view change orders for projects they have access to';
COMMENT ON POLICY "Creators and managers can update change orders" ON change_orders IS 'Creators and project managers can edit change orders (but not approved/invoiced ones)';
COMMENT ON POLICY "Approvers can update their approval decisions" ON change_order_approvals IS 'Assigned approvers can approve or reject pending approvals';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- ALTER TABLE change_order_attachments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE change_order_versions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE change_order_approvals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE change_order_line_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE change_orders DISABLE ROW LEVEL SECURITY;
-- Migration: Create Audit Triggers for Change Orders
-- Created: 2025-01-25
-- Description: Audit logging for all change order mutations

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

-- Assuming audit_logs table exists (from initial schema)
-- If not, this will need to be created first

-- Trigger for change_orders table
CREATE TRIGGER change_orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON change_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Trigger for change_order_line_items table
CREATE TRIGGER line_items_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON change_order_line_items
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Trigger for change_order_approvals table
CREATE TRIGGER approvals_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON change_order_approvals
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Trigger for change_order_versions table
CREATE TRIGGER versions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON change_order_versions
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Trigger for change_order_attachments table
CREATE TRIGGER attachments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON change_order_attachments
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TRIGGER change_orders_audit_trigger ON change_orders IS 'Logs all change order mutations to audit_logs table';
COMMENT ON TRIGGER approvals_audit_trigger ON change_order_approvals IS 'Logs all approval decisions for compliance';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- DROP TRIGGER IF EXISTS attachments_audit_trigger ON change_order_attachments;
-- DROP TRIGGER IF EXISTS versions_audit_trigger ON change_order_versions;
-- DROP TRIGGER IF EXISTS approvals_audit_trigger ON change_order_approvals;
-- DROP TRIGGER IF EXISTS line_items_audit_trigger ON change_order_line_items;
-- DROP TRIGGER IF EXISTS change_orders_audit_trigger ON change_orders;
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
-- Migration: Create Storage Bucket for Change Orders
-- Created: 2025-01-25
-- Description: Supabase Storage bucket for change order attachments

-- ============================================================================
-- CREATE STORAGE BUCKET
-- ============================================================================

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('change-order-attachments', 'change-order-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Policy: Users can view attachments for their projects
CREATE POLICY "Users can view change order attachments for their projects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'change-order-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::TEXT
      FROM projects p
      WHERE p.id IN (SELECT user_project_ids())
    )
  );

-- Policy: Users can upload attachments for their projects
CREATE POLICY "Users can upload change order attachments for their projects"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'change-order-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT p.id::TEXT
      FROM projects p
      WHERE p.id IN (SELECT user_project_ids())
    )
  );

-- Policy: Users can update their own attachments
CREATE POLICY "Users can update their own change order attachments"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'change-order-attachments'
    AND owner = auth.uid()
  );

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their own change order attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'change-order-attachments'
    AND owner = auth.uid()
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view change order attachments for their projects" ON storage.objects IS 'Users can view change order attachments for projects they have access to';
COMMENT ON POLICY "Users can upload change order attachments for their projects" ON storage.objects IS 'Users can upload attachments organized by project ID folder';

-- ============================================================================
-- STORAGE STRUCTURE
-- ============================================================================

-- Files will be organized as:
-- change-order-attachments/
--   {project_id}/
--     {change_order_id}/
--       {filename}
--
-- Example: change-order-attachments/123e4567-e89b-12d3-a456-426614174000/456e7890-e89b-12d3-a456-426614174001/quote.pdf

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- DELETE FROM storage.buckets WHERE id = 'change-order-attachments';
