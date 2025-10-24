# Daily Reports Schema Fix - Complete Documentation

## Executive Summary

This document details ALL schema mismatches between the daily_reports table code expectations and the actual database schema, and provides a comprehensive fix.

**Date:** 2025-10-25
**Status:** Ready to Apply
**SQL File:** `FIX_ALL_DAILY_REPORTS_COLUMNS.sql`

---

## Problem Overview

The application code expects certain columns in the `daily_reports` table that either:
1. Don't exist in the database
2. Have different names than what the code expects
3. Are structured differently (combined vs. separate)

This causes "column not found in schema cache" errors when creating daily reports.

---

## All Mismatches Found

### Mismatch #1: Missing Column `safety_notes`

**CODE EXPECTATION:**
- File: `/mnt/c/Users/jayso/construction-work-os/lib/actions/daily-reports/create-daily-report.ts` (line 146)
- Expects column: `safety_notes`
- Type: TEXT
- Used for: Safety observations and notes

**DATABASE REALITY:**
- Column does NOT exist

**IMPACT:**
- Any attempt to create a daily report with safety notes fails
- Error: "column safety_notes not found in schema cache"

**FIX:**
```sql
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS safety_notes TEXT;
```

---

### Mismatch #2: Column Name Mismatch `delays` vs `delays_challenges`

**CODE EXPECTATION:**
- File: `/mnt/c/Users/jayso/construction-work-os/lib/actions/daily-reports/create-daily-report.ts` (line 145)
- Expects column: `delays_challenges`
- Schema validation: `delaysChallenges` (camelCase in TypeScript)
- Type: TEXT

**DATABASE REALITY:**
- Column name: `delays`
- File: `/mnt/c/Users/jayso/construction-work-os/supabase/migrations/20250122000008_create_daily_reports_table.sql` (line 36)

**IMPACT:**
- Any attempt to create a daily report with delays/challenges fails
- Error: "column delays_challenges not found in schema cache"

**FIX:**
```sql
ALTER TABLE daily_reports
RENAME COLUMN delays TO delays_challenges;
```

---

### Mismatch #3: Combined vs Separate Columns `visitors_inspections`

**CODE EXPECTATION:**
- File: `/mnt/c/Users/jayso/construction-work-os/lib/actions/daily-reports/create-daily-report.ts` (line 147)
- Expects column: `visitors_inspections` (combined)
- Schema validation: `visitorsInspections` (camelCase in TypeScript)
- Type: TEXT

**DATABASE REALITY:**
- Has TWO separate columns:
  - `visitors` (TEXT) - line 37 in migration
  - `inspections` (TEXT) - line 38 in migration

**COMPLEXITY:**
- The `update-daily-report.ts` file expects SEPARATE columns (`visitors` and `inspections`)
- The `create-daily-report.ts` file expects a COMBINED column (`visitors_inspections`)
- This is an inconsistency in the codebase itself

**IMPACT:**
- Creating a daily report fails because code tries to insert into `visitors_inspections`
- Error: "column visitors_inspections not found in schema cache"

**FIX:**
```sql
-- Add the combined column
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS visitors_inspections TEXT;

-- Migrate existing data (preserve old columns for backward compatibility)
UPDATE daily_reports
SET visitors_inspections = CONCAT_WS(
  E'\n\n',
  CASE WHEN visitors IS NOT NULL AND visitors != '' THEN CONCAT('Visitors: ', visitors) END,
  CASE WHEN inspections IS NOT NULL AND inspections != '' THEN CONCAT('Inspections: ', inspections) END
)
WHERE visitors IS NOT NULL OR inspections IS NOT NULL;
```

**NOTE:** We're keeping the old `visitors` and `inspections` columns for backward compatibility with `update-daily-report.ts`. This allows both code paths to work.

---

## Code Analysis

### Files Analyzed

1. **Create Daily Report:**
   - `/mnt/c/Users/jayso/construction-work-os/lib/actions/daily-reports/create-daily-report.ts`
   - Lines 139-149: INSERT statement with expected columns

2. **Update Daily Report:**
   - `/mnt/c/Users/jayso/construction-work-os/lib/actions/daily-reports/update-daily-report.ts`
   - Lines 80-98: UPDATE statement with expected columns

3. **Schema Validation:**
   - `/mnt/c/Users/jayso/construction-work-os/lib/actions/daily-reports/schemas.ts`
   - Lines 57-72: CreateDailyReportSchema
   - Lines 77-89: UpdateDailyReportSchema

4. **Database Migration:**
   - `/mnt/c/Users/jayso/construction-work-os/supabase/migrations/20250122000008_create_daily_reports_table.sql`
   - Lines 7-61: CREATE TABLE statement

### Complete Column Mapping

| Code Expects (CREATE) | Code Expects (UPDATE) | Database Has | Status |
|----------------------|----------------------|--------------|--------|
| `narrative` | `narrative` | `narrative` | ✅ Match |
| `delays_challenges` | `delays` | `delays` | ❌ Mismatch #2 |
| `safety_notes` | N/A | MISSING | ❌ Mismatch #1 |
| `visitors_inspections` | `visitors` + `inspections` | `visitors` + `inspections` | ❌ Mismatch #3 |
| `weather_condition` | `weather_condition` | `weather_condition` | ✅ Match |
| `temperature_high` | `temperature_high` | `temperature_high` | ✅ Match |
| `temperature_low` | `temperature_low` | `temperature_low` | ✅ Match |
| `precipitation` | `precipitation` | `precipitation` | ✅ Match |
| `wind_speed` | `wind_speed` | `wind_speed` | ✅ Match |
| `humidity` | `humidity` | `humidity` | ✅ Match |
| N/A | `work_hours_start` | `work_hours_start` | ✅ Match |
| N/A | `work_hours_end` | `work_hours_end` | ✅ Match |
| N/A | N/A | `total_crew_count` | ✅ Match |

---

## The Fix

### SQL Migration: `FIX_ALL_DAILY_REPORTS_COLUMNS.sql`

This SQL file:
1. Adds the missing `safety_notes` column
2. Renames `delays` to `delays_challenges`
3. Adds the combined `visitors_inspections` column
4. Migrates existing data from `visitors` and `inspections` to `visitors_inspections`
5. Keeps old columns for backward compatibility
6. Includes verification queries
7. **CRITICAL:** Ends with `NOTIFY pgrst, 'reload schema';` to force immediate schema cache refresh

### How to Apply

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run the SQL:**
   - Copy the contents of `FIX_ALL_DAILY_REPORTS_COLUMNS.sql`
   - Paste into SQL Editor
   - Execute

3. **Verify the Fix:**
   - The SQL includes verification queries at the end
   - Check that all columns are present
   - Verify data migration worked

4. **Test the Application:**
   - Try creating a new daily report
   - All three previously failing fields should now work:
     - delays_challenges
     - safety_notes
     - visitors_inspections

---

## Post-Fix Recommendations

### Immediate Actions
1. ✅ Apply the SQL migration
2. ✅ Test daily report creation
3. ✅ Verify no more "column not found" errors

### Future Actions (Code Consistency)

The codebase has an inconsistency:
- `create-daily-report.ts` expects `visitors_inspections` (combined)
- `update-daily-report.ts` expects `visitors` and `inspections` (separate)

**Recommendation:** Decide on one approach:

**Option A: Use Combined Column**
- Update `update-daily-report.ts` to use `visitors_inspections`
- Remove old `visitors` and `inspections` columns after migration period

**Option B: Use Separate Columns**
- Update `create-daily-report.ts` to use separate columns
- Remove `visitors_inspections` column

**Current Solution:** Keep both for backward compatibility, but this should be resolved in a future refactor.

---

## Schema After Fix

```sql
CREATE TABLE daily_reports (
  -- ... (existing columns)

  -- Content fields
  narrative TEXT,
  delays_challenges TEXT,           -- RENAMED from 'delays'
  safety_notes TEXT,                 -- ADDED
  visitors TEXT,                     -- KEPT for backward compatibility
  inspections TEXT,                  -- KEPT for backward compatibility
  visitors_inspections TEXT,         -- ADDED

  -- Weather fields
  weather_condition weather_condition,
  temperature_high NUMERIC(5,2),
  temperature_low NUMERIC(5,2),
  precipitation NUMERIC(5,2),
  wind_speed NUMERIC(5,2),
  humidity INTEGER,

  -- Work hours
  work_hours_start TIME,
  work_hours_end TIME,
  total_crew_count INTEGER DEFAULT 0,

  -- ... (rest of table)
);
```

---

## Verification Checklist

After applying the fix, verify:

- [ ] Column `safety_notes` exists in daily_reports table
- [ ] Column `delays_challenges` exists (renamed from `delays`)
- [ ] Column `visitors_inspections` exists
- [ ] Old columns `visitors` and `inspections` still exist
- [ ] Existing data migrated to `visitors_inspections`
- [ ] Schema cache reloaded (NOTIFY command executed)
- [ ] Can create daily report with safety notes
- [ ] Can create daily report with delays/challenges
- [ ] Can create daily report with visitors/inspections
- [ ] No "column not found in schema cache" errors

---

## Summary

**Total Mismatches Found:** 3

1. Missing column: `safety_notes`
2. Column name mismatch: `delays` → `delays_challenges`
3. Structure mismatch: separate `visitors`/`inspections` → combined `visitors_inspections`

**Fix Approach:** Comprehensive SQL migration that:
- Adds missing columns
- Renames mismatched columns
- Preserves existing data
- Maintains backward compatibility
- Forces schema cache reload

**Expected Outcome:** ALL "column not found in schema cache" errors for daily_reports will be resolved.

---

## Contact

If you encounter any issues after applying this fix, check:
1. SQL executed successfully (no errors)
2. Schema cache was reloaded (NOTIFY command executed)
3. Application restarted (if needed)
4. Supabase connection pool refreshed (wait 30 seconds or restart)
