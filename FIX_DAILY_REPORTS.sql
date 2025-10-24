-- Fix daily reports table schema mismatch
-- The code expects 'delays_challenges' but DB has 'delays'

-- Rename the column to match code expectations
ALTER TABLE daily_reports
RENAME COLUMN delays TO delays_challenges;

-- Verify the fix
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'daily_reports'
  AND column_name IN ('delays', 'delays_challenges');
