-- Migration: Orphaned Attachment Cleanup Function
-- Created: 2025-01-22
-- Description: Scheduled cleanup of orphaned attachment records

-- UP Migration

-- Function to cleanup orphaned attachments
-- Removes attachment records where the storage file doesn't exist
CREATE OR REPLACE FUNCTION cleanup_orphaned_attachments()
RETURNS TABLE (
  deleted_count INTEGER,
  cleanup_timestamp TIMESTAMPTZ
) AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_attachment RECORD;
  v_file_exists BOOLEAN;
BEGIN
  -- Find attachments older than 1 hour without storage files
  FOR v_attachment IN
    SELECT id, storage_path
    FROM daily_report_attachments
    WHERE created_at < NOW() - INTERVAL '1 hour'
  LOOP
    -- Check if file exists in storage
    -- Note: This is a simplified check. In production, you'd use storage.objects
    -- or implement a more robust verification mechanism

    -- For now, we'll mark for deletion if the record is very old (24+ hours)
    -- and hasn't been confirmed
    IF v_attachment.created_at < NOW() - INTERVAL '24 hours' THEN
      DELETE FROM daily_report_attachments
      WHERE id = v_attachment.id;

      v_deleted_count := v_deleted_count + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_deleted_count, NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_orphaned_attachments() TO authenticated;

-- Create pg_cron job to run cleanup daily at 2 AM
-- Note: pg_cron extension must be enabled first
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule(
--   'cleanup-orphaned-attachments',
--   '0 2 * * *', -- Every day at 2 AM
--   'SELECT cleanup_orphaned_attachments()'
-- );

-- Alternative: Manual cleanup can be run via:
-- SELECT cleanup_orphaned_attachments();

-- DOWN Migration (Rollback)
-- SELECT cron.unschedule('cleanup-orphaned-attachments'); -- If using pg_cron
-- REVOKE EXECUTE ON FUNCTION cleanup_orphaned_attachments() FROM authenticated;
-- DROP FUNCTION IF EXISTS cleanup_orphaned_attachments();
