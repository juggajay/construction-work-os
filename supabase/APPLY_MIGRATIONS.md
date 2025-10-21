# Applying Database Migrations

## Quick Method: Via Supabase Dashboard (Recommended)

1. **Open the Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/sql/new

2. **Apply each migration in order**:

   **Migration 1: Initial Schema**
   - Copy the entire contents of `supabase/migrations/20250120000000_initial_schema.sql`
   - Paste into the SQL editor
   - Click "Run" or press Cmd/Ctrl + Enter

   **Migration 2: RLS Policies**
   - Copy the entire contents of `supabase/migrations/20250120000001_rls_policies.sql`
   - Paste into the SQL editor
   - Click "Run"

   **Migration 3: Audit Logging**
   - Copy the entire contents of `supabase/migrations/20250120000002_audit_logging.sql`
   - Paste into the SQL editor
   - Click "Run"

3. **Verify**:
   - Go to Table Editor: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/editor
   - You should see tables: `organizations`, `projects`, `profiles`, `organization_members`, `project_access`, `audit_logs`

## Alternative: Via Supabase CLI (Requires Login)

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref tokjmeqjvexnmtampyjm

# Push migrations
supabase db push
```

## Verification Queries

After applying migrations, run these queries to verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Check triggers exist
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

## Expected Results

After successful migration, you should have:
- **5 main tables**: organizations, projects, profiles, organization_members, project_access
- **1 audit table**: audit_logs
- **3 ENUMs**: org_role, project_role, project_status
- **4 helper functions**: user_org_ids, user_project_ids, is_org_admin, is_project_manager
- **15+ RLS policies** across all tables
- **5 audit triggers** (organizations, projects, profiles, organization_members, project_access)
