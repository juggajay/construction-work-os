# Supabase CLI Quick Reference

**For comprehensive documentation, see `SUPABASE_CLI_GUIDE.md`**

## Essential Commands

```bash
# Start local Supabase (Postgres + Studio + Auth)
npm run db:start

# Stop local Supabase
npm run db:stop

# Check status and get API keys
npm run db:status

# Create new migration
npm run db:migrate create_rfis_table

# Apply migrations (resets database)
npm run db:reset

# Generate TypeScript types
npm run db:types

# Run SQL query
npm run db:psql -- -c "SELECT * FROM projects;"

# Open PostgreSQL shell
npm run db:psql

# Push migrations to production
npm run db:push
```

## Local Supabase URLs

After running `npm run db:start`:

- **API**: http://localhost:54321
- **Studio (Web UI)**: http://localhost:54323
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres
- **Inbucket (Email testing)**: http://localhost:54324

## Migration Template

```sql
-- UP Migration
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_table_org_id ON table_name(org_id);

-- RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their org records"
  ON table_name FOR SELECT
  USING (org_id IN (SELECT user_org_ids(auth.uid())));

-- DOWN Migration (Rollback)
DROP TABLE IF EXISTS table_name CASCADE;
```

## Common Workflows

### Create New Table
```bash
# 1. Generate migration
npm run db:migrate create_submittals_table

# 2. Edit: supabase/migrations/TIMESTAMP_create_submittals_table.sql

# 3. Apply migration
npm run db:reset

# 4. Generate types
npm run db:types
```

### Debug RLS Policy
```bash
# Run query as specific user
npm run db:psql -- -c "
SET request.jwt.claims = '{\"sub\": \"user-uuid\"}';
SELECT * FROM projects;
"
```

### Analyze Query Performance
```bash
npm run db:psql -- -c "
EXPLAIN ANALYZE
SELECT * FROM projects WHERE org_id = 'uuid';
"
```

## RLS Policy Patterns

```sql
-- SELECT: User sees their org's records
CREATE POLICY "see_org_records" ON table_name FOR SELECT
  USING (org_id IN (SELECT user_org_ids(auth.uid())));

-- INSERT: User can create in their orgs
CREATE POLICY "insert_org_records" ON table_name FOR INSERT
  WITH CHECK (org_id IN (SELECT user_org_ids(auth.uid())));

-- UPDATE: User can update their org's records
CREATE POLICY "update_org_records" ON table_name FOR UPDATE
  USING (org_id IN (SELECT user_org_ids(auth.uid())));

-- DELETE: Owners only
CREATE POLICY "delete_org_records" ON table_name FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

## Troubleshooting

```bash
# Check if Supabase is running
npm run db:status

# View all tables
npm run db:psql -- -c "\dt"

# Describe a table
npm run db:psql -- -c "\d projects"

# Check RLS policies
npm run db:psql -- -c "\d+ projects"

# List all policies
npm run db:psql -- -c "
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public';
"
```

## Environment Setup

For local development, update `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from npm run db:status>
```

## Performance Tips

```sql
-- Add index for foreign keys
CREATE INDEX idx_rfis_project_id ON rfis(project_id);

-- Composite index for common queries
CREATE INDEX idx_projects_org_status ON projects(org_id, status);

-- Unique constraint
CREATE UNIQUE INDEX idx_rfis_project_number ON rfis(project_id, number);

-- Check index usage
EXPLAIN ANALYZE SELECT * FROM projects WHERE org_id = 'uuid';
```

## Naming Conventions

- **Tables**: `snake_case` (e.g., `organization_members`)
- **Columns**: `snake_case` (e.g., `created_at`, `org_id`)
- **Indexes**: `idx_<table>_<columns>` (e.g., `idx_projects_org_id`)
- **Policies**: Descriptive names (e.g., `"Users see their org records"`)
- **Functions**: `snake_case` (e.g., `user_org_ids()`)

## Key Files

- **Migrations**: `supabase/migrations/*.sql`
- **Seed data**: `supabase/seed.sql`
- **Config**: `supabase/config.toml`
- **Types**: `lib/types/supabase.ts` (generated)
- **Full guide**: `SUPABASE_CLI_GUIDE.md`
