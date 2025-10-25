# Supabase CLI Guide for AI Development

This guide helps AI developers (Claude Code) interact with Supabase for database operations, migrations, and testing.

## Quick Start

### Start Local Supabase
```bash
supabase start
```

This starts:
- **Postgres Database**: `postgresql://postgres:postgres@localhost:54322/postgres`
- **API Gateway**: `http://localhost:54321`
- **Studio (Web UI)**: `http://localhost:54323`
- **Inbucket (Email testing)**: `http://localhost:54324`

### Stop Local Supabase
```bash
supabase stop
```

### Reset Database (Fresh Start)
```bash
supabase db reset
```
This drops all data, re-runs migrations, and applies seed data.

---

## Common Commands for AI Developers

### 1. **Creating Migrations**

When creating new tables or schema changes:

```bash
# Generate a new migration file
supabase migration new create_rfis_table

# This creates: supabase/migrations/TIMESTAMP_create_rfis_table.sql
```

**Example migration** (the AI should write to this file):
```sql
-- supabase/migrations/20250121120000_create_rfis_table.sql

-- UP Migration
CREATE TABLE rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rfis_project_id ON rfis(project_id);
CREATE INDEX idx_rfis_status ON rfis(status);
CREATE UNIQUE INDEX idx_rfis_project_number ON rfis(project_id, number);

-- RLS Policies
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see RFIs in their projects"
  ON rfis FOR SELECT
  USING (project_id IN (SELECT user_project_ids(auth.uid())));

CREATE POLICY "Project managers can create RFIs"
  ON rfis FOR INSERT
  WITH CHECK (project_id IN (SELECT user_project_ids(auth.uid())));

CREATE POLICY "Project managers can update RFIs"
  ON rfis FOR UPDATE
  USING (project_id IN (SELECT user_project_ids(auth.uid())));

-- Triggers
CREATE TRIGGER audit_rfis
  AFTER INSERT OR UPDATE OR DELETE ON rfis
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
```

### 2. **Applying Migrations**

After creating a migration file:

```bash
# Apply migrations to local database
supabase db reset

# Or just apply new migrations (doesn't reset data)
supabase migration up
```

### 3. **Testing Queries**

Run SQL queries against local database:

```bash
# Interactive SQL shell
supabase db psql

# Run a single query
supabase db psql -c "SELECT * FROM projects LIMIT 5;"

# Run a SQL file
supabase db psql -f scripts/test_query.sql
```

### 4. **Analyzing Performance**

Check query performance:

```bash
supabase db psql -c "
EXPLAIN ANALYZE
SELECT * FROM projects WHERE org_id = 'uuid' AND status = 'active';
"
```

Look for:
- **Seq Scan** = Missing index (slow)
- **Index Scan** = Using index (fast)
- **Execution time** >100ms = Needs optimization

### 5. **Checking Migration Status**

See which migrations have been applied:

```bash
supabase migration list
```

### 6. **Generating TypeScript Types**

Generate types from database schema:

```bash
supabase gen types typescript --local > lib/types/supabase.ts
```

This creates TypeScript types for all tables, views, and functions.

### 7. **Inspecting Database**

View database structure:

```bash
# List all tables
supabase db psql -c "\dt"

# Describe a table
supabase db psql -c "\d projects"

# List all RLS policies
supabase db psql -c "
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
"
```

---

## Workflows for AI Developers

### Workflow 1: Creating a New Table

```bash
# 1. Generate migration
supabase migration new create_submittals_table

# 2. AI writes SQL to the generated file
# (See migration example above)

# 3. Apply migration
supabase db reset

# 4. Verify table exists
supabase db psql -c "\d submittals"

# 5. Generate TypeScript types
supabase gen types typescript --local > lib/types/supabase.ts
```

### Workflow 2: Debugging RLS Policies

```bash
# 1. Start local Supabase
supabase start

# 2. Test RLS as a specific user
supabase db psql -c "
-- Set the JWT claims (simulate logged-in user)
SET request.jwt.claims = '{\"sub\": \"user-uuid-here\"}';

-- Now queries run with RLS enforced
SELECT * FROM projects;
"

# 3. Check which policies apply
supabase db psql -c "\d+ projects"
```

### Workflow 3: Performance Optimization

```bash
# 1. Find slow queries
supabase db psql -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"

# 2. Analyze specific query
supabase db psql -c "
EXPLAIN ANALYZE
SELECT * FROM projects WHERE org_id = 'uuid';
"

# 3. Add index if needed
supabase migration new add_index_projects_org_id

# Write to migration file:
# CREATE INDEX idx_projects_org_id ON projects(org_id);

# 4. Apply and re-test
supabase db reset
```

### Workflow 4: Testing Seed Data

```bash
# 1. Edit supabase/seed.sql with test data

# 2. Reset database (applies migrations + seed)
supabase db reset

# 3. Verify seed data
supabase db psql -c "SELECT * FROM organizations;"
```

---

## Environment Variables

### For Local Development

Update `.env.local` to use local Supabase:

```bash
# Local Supabase (when running supabase start)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from supabase start output>

# Optional: Service role key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=<get from supabase start output>
```

**To get keys after running `supabase start`:**
```bash
supabase status
```

Output shows:
- `API URL`: Use for `NEXT_PUBLIC_SUPABASE_URL`
- `anon key`: Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role key`: Use for `SUPABASE_SERVICE_ROLE_KEY`

### For Production

Use your Supabase Cloud project credentials:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

---

## Pushing to Production

### 1. Link to Remote Project

```bash
supabase link --project-ref your-project-ref
```

### 2. Push Migrations to Production

```bash
# Review what will change
supabase db diff

# Push migrations
supabase db push
```

### 3. Pull Production Schema (for reference)

```bash
supabase db pull
```

---

## Direct Database Connection (When CLI Fails)

**⚠️ IMPORTANT:** If `supabase db push` or CLI connection methods fail with timeouts or authentication errors, use this direct connection method.

### When to Use Direct Connection

Use this method if you encounter:
- Connection timeout errors when using `supabase db push`
- "password authentication failed for user" errors
- Pooler connection issues
- CLI connection failures despite correct credentials

### Method: Direct PostgreSQL Connection with Node.js

**Step 1: Get the Direct Connection URL**

From your Supabase Dashboard → Project Settings → Database → Connection String:
- **DO NOT** use the "Connection pooling" URL (ends with `:6543`)
- **USE** the "Direct connection" URL (ends with `:5432`)

Format:
```
postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

Example:
```
postgresql://postgres:fJ1XI7m5uBkvokYS@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres
```

**Step 2: Create a Migration Runner Script**

Create `scripts/run-migration-simple.js`:

```javascript
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Use direct connection URL (not pooler)
const databaseUrl = 'postgresql://postgres:<YOUR_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres'

async function runMigration() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('📤 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!')

    // Get migration file name from command line argument
    const migrationFile = process.argv[2]
    if (!migrationFile) {
      throw new Error('Please provide migration file name as argument')
    }

    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Migration file not found: ${sqlPath}`)
    }

    console.log(`📤 Executing migration: ${migrationFile}`)
    const sql = fs.readFileSync(sqlPath, 'utf8')

    await client.query(sql)
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('📤 Database connection closed')
  }
}

runMigration()
```

**Step 3: Run the Migration**

```bash
# Run a specific migration file
node scripts/run-migration-simple.js 20251026000000_your_migration.sql

# Example:
node scripts/run-migration-simple.js 20251026000000_add_project_team_management_rls.sql
```

### Why This Works

1. **Direct Connection**: Bypasses Supabase CLI and connection pooler issues
2. **PostgreSQL Client**: Uses battle-tested `pg` library directly
3. **Simple & Reliable**: No intermediate tools or authentication layers
4. **Full SQL Support**: Can execute any valid PostgreSQL SQL

### Security Notes

- ⚠️ **Never commit** database passwords to git
- ⚠️ Store the connection URL in environment variables for production use
- ⚠️ The service role key has full database access - use carefully

### Alternative: Using Environment Variables

Update the script to use environment variables:

```javascript
// At the top of run-migration-simple.js
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:54322/postgres'
```

Then run:
```bash
DATABASE_URL='postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres' node scripts/run-migration-simple.js migration_file.sql
```

---

## Troubleshooting

### Problem: "Connection refused" errors

**Solution**: Make sure Supabase is running:
```bash
supabase status
# If not running:
supabase start
```

### Problem: Migrations fail

**Solution**: Check migration syntax:
```bash
# Test migration in psql first
supabase db psql -f supabase/migrations/your_migration.sql
```

### Problem: RLS policies not working

**Solution**: Verify policies are enabled:
```bash
supabase db psql -c "
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
"
# rowsecurity should be 't' (true)
```

### Problem: Slow queries

**Solution**: Check for missing indexes:
```bash
supabase db psql -c "
EXPLAIN ANALYZE
SELECT * FROM your_table WHERE your_column = 'value';
"
# Look for "Seq Scan" - means no index
```

---

## AI Developer Checklist

When working with Supabase, the AI should:

- ✅ **Always create migrations** for schema changes (never manually edit database)
- ✅ **Include RLS policies** on all tables
- ✅ **Add indexes** for foreign keys and frequently queried columns
- ✅ **Test queries with EXPLAIN ANALYZE** before deploying
- ✅ **Generate TypeScript types** after schema changes
- ✅ **Include DOWN migrations** for rollback capability
- ✅ **Test RLS policies** with different user contexts
- ✅ **Use transactions** for multi-step operations
- ✅ **Add audit triggers** for critical tables
- ✅ **Document migration purpose** in file name and comments

---

## Quick Reference

| Task | Command |
|------|---------|
| Start local Supabase | `supabase start` |
| Stop local Supabase | `supabase stop` |
| Create migration | `supabase migration new <name>` |
| Apply migrations | `supabase db reset` |
| SQL shell | `supabase db psql` |
| Generate types | `supabase gen types typescript --local > lib/types/supabase.ts` |
| View status | `supabase status` |
| List tables | `supabase db psql -c "\dt"` |
| Describe table | `supabase db psql -c "\d <table>"` |
| Push to production | `supabase db push` |
| **Direct connection (CLI fails)** | `node scripts/run-migration-simple.js <migration-file.sql>` |

---

## Resources

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Local Development**: https://supabase.com/docs/guides/local-development
- **Migrations**: https://supabase.com/docs/guides/cli/local-development#database-migrations
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
- **Project Config**: `supabase/config.toml`
