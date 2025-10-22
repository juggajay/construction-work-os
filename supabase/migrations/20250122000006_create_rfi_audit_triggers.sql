-- RFI Module: Audit Logging Triggers
-- This migration creates audit triggers for all RFI tables using the existing log_changes() function

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

-- Audit trigger for rfis table
-- Logs all INSERT, UPDATE, and DELETE operations
CREATE TRIGGER rfis_audit
  AFTER INSERT OR UPDATE OR DELETE ON rfis
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Audit trigger for rfi_responses table
-- Logs all INSERT, UPDATE, and DELETE operations
CREATE TRIGGER rfi_responses_audit
  AFTER INSERT OR UPDATE OR DELETE ON rfi_responses
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Audit trigger for rfi_attachments table
-- Logs all INSERT, UPDATE, and DELETE operations
CREATE TRIGGER rfi_attachments_audit
  AFTER INSERT OR UPDATE OR DELETE ON rfi_attachments
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TRIGGER rfis_audit ON rfis
  IS 'Logs all changes to rfis table for audit compliance';

COMMENT ON TRIGGER rfi_responses_audit ON rfi_responses
  IS 'Logs all changes to rfi_responses table for audit compliance';

COMMENT ON TRIGGER rfi_attachments_audit ON rfi_attachments
  IS 'Logs all changes to rfi_attachments table for audit compliance';
