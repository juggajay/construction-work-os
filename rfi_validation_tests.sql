-- ============================================================================
-- RFI MODULE VALIDATION TESTS
-- Run these queries in Supabase SQL Editor to validate the RFI database
-- ============================================================================

-- ============================================================================
-- TEST 1: Verify Tables Exist
-- ============================================================================
SELECT
  'Tables Created' AS test_name,
  COUNT(*) AS table_count,
  CASE
    WHEN COUNT(*) = 3 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('rfis', 'rfi_responses', 'rfi_attachments');

-- ============================================================================
-- TEST 2: Verify Enums Exist
-- ============================================================================
SELECT
  'Enums Created' AS test_name,
  COUNT(*) AS enum_count,
  CASE
    WHEN COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status
FROM pg_type
WHERE typname IN ('rfi_status', 'rfi_priority');

-- ============================================================================
-- TEST 3: Verify RFI Status Enum Values
-- ============================================================================
SELECT
  'RFI Status Enum Values' AS test_name,
  enumlabel AS value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'rfi_status'
ORDER BY e.enumsortorder;

-- ============================================================================
-- TEST 4: Verify Indexes on rfis Table
-- ============================================================================
SELECT
  'RFI Indexes' AS test_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'rfis'
ORDER BY indexname;

-- ============================================================================
-- TEST 5: Verify RLS is Enabled
-- ============================================================================
SELECT
  'RLS Enabled' AS test_name,
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rfis', 'rfi_responses', 'rfi_attachments');

-- ============================================================================
-- TEST 6: Verify RLS Policies
-- ============================================================================
SELECT
  'RLS Policies' AS test_name,
  schemaname,
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE tablename IN ('rfis', 'rfi_responses', 'rfi_attachments')
ORDER BY tablename, policyname;

-- ============================================================================
-- TEST 7: Verify Functions Exist
-- ============================================================================
SELECT
  'Functions' AS test_name,
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname IN ('next_rfi_number', 'update_updated_at', 'log_changes')
ORDER BY proname;

-- ============================================================================
-- TEST 8: Verify Triggers
-- ============================================================================
SELECT
  'Triggers' AS test_name,
  trigger_name,
  event_manipulation AS trigger_event,
  event_object_table AS table_name
FROM information_schema.triggers
WHERE event_object_table IN ('rfis', 'rfi_responses', 'rfi_attachments')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- TEST 9: Verify Foreign Keys
-- ============================================================================
SELECT
  'Foreign Keys' AS test_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('rfis', 'rfi_responses', 'rfi_attachments')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- TEST 10: Test RFI Numbering Function
-- Expected: Should return RFI-001 for first RFI in a project
-- ============================================================================
-- Note: Replace <project-uuid> with an actual project UUID from your database
-- Example:
-- SELECT
--   'RFI Numbering Function' AS test_name,
--   next_rfi_number('<project-uuid>') AS next_number,
--   'Should be RFI-001 for new project' AS expected;

-- ============================================================================
-- TEST 11: Verify Column Constraints on rfis Table
-- ============================================================================
SELECT
  'RFI Table Columns' AS test_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'rfis'
ORDER BY ordinal_position;

-- ============================================================================
-- TEST 12: Verify Unique Constraints
-- ============================================================================
SELECT
  'Unique Constraints' AS test_name,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN ('rfis', 'rfi_responses', 'rfi_attachments')
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- TEST 13: Verify Check Constraints
-- ============================================================================
SELECT
  'Check Constraints' AS test_name,
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('rfis', 'rfi_responses', 'rfi_attachments')
ORDER BY tc.table_name;

-- ============================================================================
-- SUMMARY TEST: Overall Migration Status
-- ============================================================================
SELECT
  'Migration Summary' AS report_section,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('rfis', 'rfi_responses', 'rfi_attachments')) AS tables_created,
  (SELECT COUNT(*) FROM pg_type
   WHERE typname IN ('rfi_status', 'rfi_priority')) AS enums_created,
  (SELECT COUNT(*) FROM pg_indexes
   WHERE tablename = 'rfis') AS rfis_indexes,
  (SELECT COUNT(*) FROM pg_policies
   WHERE tablename IN ('rfis', 'rfi_responses', 'rfi_attachments')) AS rls_policies,
  (SELECT COUNT(*) FROM information_schema.triggers
   WHERE event_object_table IN ('rfis', 'rfi_responses', 'rfi_attachments')) AS triggers_created,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name IN ('rfis', 'rfi_responses', 'rfi_attachments')) = 3
    THEN '✅ ALL MIGRATIONS SUCCESSFUL'
    ELSE '❌ INCOMPLETE MIGRATION'
  END AS overall_status;

-- ============================================================================
-- OPTIONAL: Sample Data Insertion Test
-- Uncomment and replace UUIDs to test actual data insertion
-- ============================================================================
/*
-- Insert a test RFI (requires valid project_id and user_id)
INSERT INTO rfis (
  project_id,
  number,
  title,
  description,
  status,
  priority,
  created_by
) VALUES (
  '<project-uuid>',
  'RFI-TEST-001',
  'Test RFI',
  'This is a test RFI to verify database functionality',
  'draft',
  'medium',
  '<user-uuid>'
);

-- Verify insertion
SELECT * FROM rfis WHERE number = 'RFI-TEST-001';

-- Clean up test data
DELETE FROM rfis WHERE number = 'RFI-TEST-001';
*/
