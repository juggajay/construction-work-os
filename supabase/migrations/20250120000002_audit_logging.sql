-- Audit Logging System
-- This migration creates immutable audit trails for all state changes

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Audit logs are immutable (no updates or deletes)
  CONSTRAINT no_empty_values CHECK (
    (action = 'INSERT' AND new_values IS NOT NULL) OR
    (action = 'UPDATE' AND old_values IS NOT NULL AND new_values IS NOT NULL) OR
    (action = 'DELETE' AND old_values IS NOT NULL)
  )
);

-- Indexes for audit log queries
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id, timestamp DESC);

-- ============================================================================
-- AUDIT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get the current user ID (will be NULL for system operations)
  user_uuid := auth.uid();

  -- Insert audit log record
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_id,
    timestamp
  )
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE
      WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
      WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW)
      ELSE NULL
    END,
    user_uuid,
    now()
  );

  -- Return the appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT TRIGGERS (AFTER triggers to not block transactions)
-- ============================================================================

-- Organizations
CREATE TRIGGER organizations_audit
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Projects
CREATE TRIGGER projects_audit
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Organization members
CREATE TRIGGER organization_members_audit
  AFTER INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- Project access
CREATE TRIGGER project_access_audit
  AFTER INSERT OR UPDATE OR DELETE ON project_access
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

-- ============================================================================
-- RLS POLICIES FOR AUDIT LOGS
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view audit logs for records they have access to
CREATE POLICY "Users can view audit logs for accessible records"
  ON audit_logs FOR SELECT
  USING (
    -- Allow viewing audit logs for organizations the user belongs to
    (table_name = 'organizations' AND record_id IN (SELECT user_org_ids(auth.uid())))
    OR
    -- Allow viewing audit logs for projects the user has access to
    (table_name = 'projects' AND record_id IN (SELECT user_project_ids(auth.uid())))
    OR
    -- Allow viewing audit logs for org memberships in user's orgs
    (table_name = 'organization_members' AND (new_values->>'org_id')::uuid IN (SELECT user_org_ids(auth.uid())))
    OR
    -- Allow viewing audit logs for project access in user's projects
    (table_name = 'project_access' AND (new_values->>'project_id')::uuid IN (SELECT user_project_ids(auth.uid())))
    OR
    -- Allow viewing own audit logs
    (user_id = auth.uid())
  );

-- No INSERT policy - only triggers can insert
-- No UPDATE or DELETE policies - audit logs are immutable

-- ============================================================================
-- HELPER FUNCTION FOR AUDIT QUERIES
-- ============================================================================

-- Get audit history for a specific record
CREATE OR REPLACE FUNCTION get_audit_history(
  p_table_name TEXT,
  p_record_id UUID,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  action TEXT,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  user_email TEXT,
  "timestamp" TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.old_values,
    al.new_values,
    al.user_id,
    au.email AS user_email,
    al.timestamp
  FROM audit_logs al
  LEFT JOIN auth.users au ON au.id = al.user_id
  WHERE al.table_name = p_table_name
    AND al.record_id = p_record_id
  ORDER BY al.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all data changes';
COMMENT ON FUNCTION log_changes IS 'Trigger function that logs INSERT/UPDATE/DELETE operations';
COMMENT ON FUNCTION get_audit_history IS 'Retrieve audit history for a specific record';

COMMENT ON COLUMN audit_logs.table_name IS 'Name of the table where the change occurred';
COMMENT ON COLUMN audit_logs.record_id IS 'ID of the record that changed';
COMMENT ON COLUMN audit_logs.action IS 'Type of operation: INSERT, UPDATE, or DELETE';
COMMENT ON COLUMN audit_logs.old_values IS 'JSONB snapshot of record before change (UPDATE/DELETE only)';
COMMENT ON COLUMN audit_logs.new_values IS 'JSONB snapshot of record after change (INSERT/UPDATE only)';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (NULL for system operations)';
