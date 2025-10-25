-- Migration: Fix Daily Reports User Foreign Keys
-- Created: 2025-10-25
-- Description: Update daily_reports foreign keys to reference auth.users instead of profiles
--              This makes it consistent with change_orders and submittals tables, and fixes
--              PostgREST query errors when trying to embed user data.

-- ============================================================================
-- UPDATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Drop existing foreign key constraints that reference profiles
ALTER TABLE daily_reports
  DROP CONSTRAINT IF EXISTS daily_reports_created_by_fkey;

ALTER TABLE daily_reports
  DROP CONSTRAINT IF EXISTS daily_reports_submitted_by_fkey;

ALTER TABLE daily_reports
  DROP CONSTRAINT IF EXISTS daily_reports_approved_by_fkey;

-- Add new foreign key constraints referencing auth.users
-- This aligns with the pattern used in change_orders and submittals tables
ALTER TABLE daily_reports
  ADD CONSTRAINT daily_reports_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE daily_reports
  ADD CONSTRAINT daily_reports_submitted_by_fkey
  FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE daily_reports
  ADD CONSTRAINT daily_reports_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT daily_reports_created_by_fkey ON daily_reports IS
  'References auth.users for consistency with other tables (change_orders, submittals)';

COMMENT ON CONSTRAINT daily_reports_submitted_by_fkey ON daily_reports IS
  'References auth.users for PostgREST embedded queries';

COMMENT ON CONSTRAINT daily_reports_approved_by_fkey ON daily_reports IS
  'References auth.users for PostgREST embedded queries';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================

-- To rollback, drop the auth.users foreign keys and restore the profiles foreign keys:
-- ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_created_by_fkey;
-- ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_submitted_by_fkey;
-- ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS daily_reports_approved_by_fkey;
-- ALTER TABLE daily_reports ADD CONSTRAINT daily_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id);
-- ALTER TABLE daily_reports ADD CONSTRAINT daily_reports_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES profiles(id);
-- ALTER TABLE daily_reports ADD CONSTRAINT daily_reports_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES profiles(id);
