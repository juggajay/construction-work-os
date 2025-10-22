-- Migration: Create Audit Triggers for Daily Reports
-- Created: 2025-01-22
-- Description: Audit logging triggers for all daily report tables to track changes

-- UP Migration

-- Audit trigger for daily_reports table
CREATE TRIGGER daily_reports_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Audit trigger for daily_report_crew_entries table
CREATE TRIGGER crew_entries_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON daily_report_crew_entries
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Audit trigger for daily_report_equipment_entries table
CREATE TRIGGER equipment_entries_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON daily_report_equipment_entries
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Audit trigger for daily_report_material_entries table
CREATE TRIGGER material_entries_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON daily_report_material_entries
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Audit trigger for daily_report_incidents table (especially important for OSHA-recordable incidents)
CREATE TRIGGER incidents_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON daily_report_incidents
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Audit trigger for daily_report_attachments table
CREATE TRIGGER attachments_audit_trigger
  AFTER INSERT OR DELETE ON daily_report_attachments
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- DOWN Migration (Rollback)
-- DROP TRIGGER IF EXISTS attachments_audit_trigger ON daily_report_attachments;
-- DROP TRIGGER IF EXISTS incidents_audit_trigger ON daily_report_incidents;
-- DROP TRIGGER IF EXISTS material_entries_audit_trigger ON daily_report_material_entries;
-- DROP TRIGGER IF EXISTS equipment_entries_audit_trigger ON daily_report_equipment_entries;
-- DROP TRIGGER IF EXISTS crew_entries_audit_trigger ON daily_report_crew_entries;
-- DROP TRIGGER IF EXISTS daily_reports_audit_trigger ON daily_reports;
