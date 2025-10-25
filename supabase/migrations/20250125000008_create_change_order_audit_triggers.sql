-- Migration: Create Audit Triggers for Change Orders
-- Created: 2025-01-25
-- Description: Audit logging for all change order mutations

-- ============================================================================
-- AUDIT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id, timestamp)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid(), NOW());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id, timestamp)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id, timestamp)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid(), NOW());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

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
