# Manual Migration Application Guide

If you can't use the Supabase CLI, apply migrations manually via the Supabase SQL Editor.

## Steps

### 1. Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm
2. Click **SQL Editor** in the left sidebar
3. Click **+ New query**

### 2. Run Each Migration (in order)

Copy and paste each migration below, one at a time. Click **Run** after each.

---

## Migration 1: Initial Schema

```sql
-- Copy the contents from: supabase/migrations/20250120000000_initial_schema.sql
```

**What this does**: Creates tables (organizations, projects, profiles, organization_members, project_access)

---

## Migration 2: RLS Policies

```sql
-- Copy the contents from: supabase/migrations/20250120000001_rls_policies.sql
```

**What this does**: Enables Row-Level Security and creates auth policies

---

## Migration 3: Audit Logging

```sql
-- Copy the contents from: supabase/migrations/20250120000002_audit_logging.sql
```

**What this does**: Creates audit_logs table and triggers

---

## Verify Migrations Applied

Run this in SQL Editor to verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('organizations', 'projects', 'profiles', 'organization_members', 'project_access', 'audit_logs')
ORDER BY table_name;

-- Check RLS is enabled on organizations
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'organizations';

-- Check RLS policies exist
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'organizations';
```

Expected output:
- 6 tables should be listed
- `rowsecurity` should be `t` (true)
- 4 policies should be listed (SELECT, INSERT, UPDATE, DELETE)

---

## After Migrations Applied

1. Try creating an organization again in your app
2. The RLS error should be fixed
3. Check server logs for the detailed error if it still fails

