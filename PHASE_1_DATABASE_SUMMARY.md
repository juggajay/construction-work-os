# Phase 1: Database Foundation - COMPLETE ✅

**Date**: 2025-01-22
**Change ID**: `add-daily-reports-module`
**Status**: Migrations created, ready to apply when Docker starts

---

## 📦 Migrations Created (14 files)

### Core Tables & Enums
1. ✅ `20250122000007_create_daily_report_enums.sql`
   - 5 enum types: status, weather_condition, incident_type, severity, attachment_type

2. ✅ `20250122000008_create_daily_reports_table.sql`
   - Main daily_reports table
   - Unique constraint: one report per project per date (when submitted/approved)
   - 4 performance indexes
   - Constraint checks for temperature, humidity ranges

3. ✅ `20250122000009_create_daily_report_crew_entries_table.sql`
   - Crew hours by trade and classification
   - Trigger to update parent `total_crew_count`
   - 3 indexes including subcontractor tracking

4. ✅ `20250122000010_create_daily_report_equipment_entries_table.sql`
   - Equipment usage, hours, fuel, rental costs
   - 2 indexes for lookups and analytics

5. ✅ `20250122000011_create_daily_report_material_entries_table.sql`
   - Material deliveries with supplier and location
   - 1 index for daily report lookups

6. ✅ `20250122000012_create_daily_report_incidents_table.sql`
   - Safety incidents, delays, inspections, visitors
   - 3 indexes including OSHA recordable tracking

7. ✅ `20250122000013_create_daily_report_attachments_table.sql`
   - Photo/document storage with EXIF metadata
   - GPS coordinates (latitude/longitude)
   - 3 indexes including GPS-tagged photos

### Row-Level Security (RLS)
8. ✅ `20250122000014_create_daily_reports_rls_policies.sql`
   - 5 policies: view, create draft, update own draft, PM approve, admin delete

9. ✅ `20250122000015_create_crew_entries_rls_policies.sql`
   - 4 policies: view, create, update, delete (all scoped to draft reports)

10. ✅ `20250122000016_create_equipment_entries_rls_policies.sql`
    - 4 policies: view, create, update, delete

11. ✅ `20250122000017_create_material_entries_rls_policies.sql`
    - 4 policies: view, create, update, delete

12. ✅ `20250122000018_create_incidents_rls_policies.sql`
    - 4 policies: view, create, update, delete

13. ✅ `20250122000019_create_attachments_rls_policies.sql`
    - 3 policies: view, upload, delete (only uploader can delete)

### Audit Logging
14. ✅ `20250122000020_create_daily_report_audit_triggers.sql`
    - 6 audit triggers for all tables
    - Tracks INSERT, UPDATE, DELETE operations

---

## 🔧 Next Steps to Apply Migrations

### Step 1: Start Docker & Supabase

```bash
# Start Docker Desktop first (required)
# Then start Supabase
npm run db:start
```

### Step 2: Apply Migrations

```bash
# Apply all migrations (resets local database)
npm run db:reset

# Verify migrations applied
npm run db:status
```

### Step 3: Verify Schema

```bash
# Check tables created
npm run db:psql -- -c "\dt"

# Check enums
npm run db:psql -- -c "\dT"

# Check specific table structure
npm run db:psql -- -c "\d daily_reports"
```

### Step 4: Test RLS Policies

```bash
# Test SELECT policy
npm run db:psql -- -c "SELECT * FROM daily_reports LIMIT 1;"

# Test unique constraint
npm run db:psql -- -c "
  INSERT INTO daily_reports (project_id, report_date, status, created_by)
  VALUES ('00000000-0000-0000-0000-000000000001', '2025-01-20', 'submitted', '00000000-0000-0000-0000-000000000001');
"
# Should succeed first time, fail second time (duplicate)
```

### Step 5: Generate TypeScript Types

```bash
# Generate types from schema
npm run db:types

# Verify types generated
cat lib/types/supabase.ts | grep "daily_reports"
```

### Step 6: Create Storage Bucket (Manual)

Option 1: Via Supabase Console
1. Navigate to http://localhost:54323 (Supabase Studio)
2. Go to Storage
3. Create new bucket: `daily-report-attachments`
4. Set as Private (RLS-controlled)
5. Max file size: 20MB

Option 2: Via SQL
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-report-attachments', 'daily-report-attachments', false);

-- Set bucket policy
CREATE POLICY "Users can upload attachments to accessible reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'daily-report-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );
```

---

## 📊 Schema Overview

```
daily_reports (main table)
├── 7 child tables:
│   ├── daily_report_crew_entries (crew hours by trade)
│   ├── daily_report_equipment_entries (equipment usage)
│   ├── daily_report_material_entries (material deliveries)
│   ├── daily_report_incidents (safety, delays, inspections)
│   └── daily_report_attachments (photos, documents)
├── 5 enum types
├── 14 indexes (optimized queries)
├── 24 RLS policies (multi-tenant security)
└── 6 audit triggers (immutable logs)
```

---

## ✅ Validation Checklist

After applying migrations, verify:

- [ ] All 7 tables exist in database
- [ ] All 5 enum types created
- [ ] Unique constraint on `daily_reports(project_id, report_date)` works
- [ ] Crew entry insert triggers `total_crew_count` update
- [ ] RLS policies prevent unauthorized access
- [ ] Audit triggers log all mutations
- [ ] Storage bucket `daily-report-attachments` created
- [ ] TypeScript types generated in `lib/types/supabase.ts`
- [ ] No TypeScript errors after type generation: `npm run build`

---

## 🚀 Ready for Phase 2

Once Phase 1 is validated, proceed to:

**Phase 2: Weather API Integration** (3 tasks)
- Weather API client (OpenWeatherMap)
- Weather caching layer
- Weather utility functions

See `openspec/changes/add-daily-reports-module/tasks.md` (Tasks 2.1-2.3)

---

## 📝 Notes

### Design Decisions Implemented

1. **One Report Per Date**: Partial unique index allows multiple drafts but only one submitted/approved report per project per date

2. **Total Crew Count Caching**: Trigger automatically updates `total_crew_count` when crew entries change (performance optimization)

3. **OSHA Compliance**: Special index on `osha_recordable` incidents for compliance reporting

4. **GPS Privacy**: GPS coordinates stored in database but can be stripped from photos via future admin setting

5. **Soft Deletes**: All tables use `deleted_at` for audit trail preservation

6. **Multi-Tenant Security**: All RLS policies use `user_project_ids()` helper for proper access control

### Known Limitations (To Address in Future)

- Storage bucket RLS policies need refinement for production
- Weather data not yet integrated (Phase 2)
- No materialized views for analytics yet (Phase 6)
- Photo compression handled client-side (Phase 4)

---

**Phase 1 Status**: ✅ COMPLETE (14/14 migrations created)
**Next Phase**: Weather API Integration (Phase 2)
