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
