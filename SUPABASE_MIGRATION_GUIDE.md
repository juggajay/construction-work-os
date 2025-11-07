# Supabase Migration Guide

## Quick Reference: How to Apply Migrations to Remote Database

### ✅ WORKING METHOD: Supabase Management API

**Use this script**: `scripts/apply-migrations-mgmt-api.js`

**Command**:
```bash
node scripts/apply-migrations-mgmt-api.js
```

**Requirements**:
- Supabase Access Token: Set `SUPABASE_ACCESS_TOKEN` in `.env.local`
- Project Reference: Set `SUPABASE_PROJECT_REF` in `.env.local`

### How It Works

The Management API script:
1. Reads migration SQL files from `supabase/migrations/`
2. Executes them via HTTPS POST to `https://api.supabase.com/v1/projects/{projectRef}/database/query`
3. Returns detailed success/failure messages

### Example Usage

```javascript
// The script is already configured with credentials
// Just add your migration files to the migrations array:

const migrations = [
  {
    file: 'supabase/migrations/20251025025919_fix_change_order_numbering_case_type_mismatch.sql',
    name: 'fix_change_order_numbering_case_type_mismatch'
  },
  {
    file: 'supabase/migrations/20251025030803_fix_daily_reports_user_foreign_keys.sql',
    name: 'fix_daily_reports_user_foreign_keys'
  }
];
```

---

## ❌ Methods That DON'T WORK (Don't Waste Time Trying These)

### 1. Direct PostgreSQL Connection
```bash
# DOES NOT WORK - Connection timeout
psql $DATABASE_URL
```
**Error**: Timeout connecting to pooler

### 2. Supabase CLI Link
```bash
# DOES NOT WORK - Connection timeout
npx supabase link --project-ref $SUPABASE_PROJECT_REF
```
**Error**: `failed to connect to host=aws-1-us-east-1.pooler.supabase.com dial tcp: i/o timeout`

### 3. Direct Port 6543 (Transaction Pooler)
```bash
# DOES NOT WORK - Connection timeout
psql $DATABASE_URL
# (Using port 6543)
```
**Error**: Timeout

### 4. Supabase SDK (supabase-js)
```bash
# DOES NOT WORK - No exec_sql function
node scripts/apply-migrations-sdk.js
```
**Error**: REST API doesn't have `exec_sql` RPC function in production

---

## 🔑 Credentials

### Required Environment Variables

Create a `.env.local` file (or `.env.production` for production) with the following variables:

```env
# Supabase Project Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Migration API Access
SUPABASE_ACCESS_TOKEN=your_management_api_token
SUPABASE_PROJECT_REF=your_project_reference

# Database Connection (optional, for direct connections)
DATABASE_URL=postgresql://postgres.[project_ref]:[password]@[host]:5432/postgres
```

### How to Get These Values

1. **Project URL & Keys**: Go to your Supabase Dashboard → Project Settings → API
2. **Access Token**: Go to Supabase Dashboard → Account → Access Tokens → Create new token
3. **Project Reference**: Found in your project URL (e.g., `https://[project_ref].supabase.co`)

**⚠️ SECURITY**: Never commit `.env.local` or `.env.production` to git. These files are already in `.gitignore`.

---

## 📝 Creating and Applying New Migrations

### Step 1: Create Migration File
```bash
# Create migration with timestamp
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_your_migration_name.sql
```

### Step 2: Add Migration to Script
Edit `scripts/apply-migrations-mgmt-api.js` and add your migration to the array:

```javascript
const migrations = [
  // ... existing migrations
  {
    file: 'supabase/migrations/20251025XXXXXX_your_migration_name.sql',
    name: 'your_migration_name'
  }
];
```

### Step 3: Run Migration Script
```bash
node scripts/apply-migrations-mgmt-api.js
```

### Step 4: Verify Success
Look for:
```
✅ Migration your_migration_name completed successfully
📊 Results:
   ✅ Successful: 1
   ❌ Failed: 0
```

---

## 🐛 Common Issues and Solutions

### Issue 1: Foreign Key Mismatches
**Error**: `Could not find a relationship between 'table_name' and 'users'`

**Solution**: The remote database uses different foreign key relationships than local. Remove user/profile joins from queries:

```typescript
// ❌ DON'T DO THIS (causes 400 errors)
.select(`
  *,
  creator:profiles!created_by(id, full_name, email)
`)

// ✅ DO THIS INSTEAD
.select(`
  *
`)
// Then add TODO comment to re-enable after schema sync
```

### Issue 2: Column Doesn't Exist
**Error**: `column table_name.column_name does not exist`

**Solution**: Check remote schema vs local schema. Common differences:
- `change_order_approvals.rejection_reason` - doesn't exist in remote
- User foreign keys may reference `auth.users` instead of `profiles`

### Issue 3: CASE/WHEN Type Errors
**Error**: `argument of CASE/WHEN must be type boolean, not type text`

**Solution**: Cast ENUMs to text in CASE statements:
```sql
-- ❌ WRONG
CASE p_status
  WHEN 'contemplated' THEN

-- ✅ CORRECT
CASE p_status::text
  WHEN 'contemplated' THEN
```

---

## 🔍 Checking Migration Status

### List Applied Migrations
```bash
# Via Management API (if you have a query endpoint)
# Or check the migrations table directly:
```

```sql
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;
```

### Verify Change Order Numbering
Create a test change order and verify it gets assigned a number like `PCO-001`, `COR-001`, or `CO-001` based on status.

---

## 📚 Related Files

- `scripts/apply-migrations-mgmt-api.js` - **USE THIS** for applying migrations
- `scripts/apply-migrations-direct.js` - Direct connection (doesn't work)
- `scripts/apply-migrations-api.js` - Alternative Management API approach
- `scripts/apply-migrations-sdk.js` - Supabase SDK approach (doesn't work)
- `scripts/apply-migrations-pg.js` - pg client approach (doesn't work)

---

## ✅ Recently Applied Migrations (as of 2025-10-25)

1. **20251025025919_fix_change_order_numbering_case_type_mismatch.sql**
   - Fixed CASE/WHEN type mismatch in `get_next_co_number()` function
   - Status: ✅ Applied successfully
   - Verified: PCO-002 created correctly

2. **20251025030803_fix_daily_reports_user_foreign_keys.sql**
   - Updated foreign keys to reference `auth.users` instead of `profiles`
   - Status: ✅ Applied successfully
   - Verified: Daily reports load without errors

---

## 🎯 Pro Tips

1. **Always test migrations locally first** using `supabase db reset`
2. **Update the migrations array in apply-migrations-mgmt-api.js** before running
3. **Keep migration files small and focused** on one change
4. **Document schema differences** between local and remote in this file
5. **Don't try direct PostgreSQL connections** - they timeout due to network restrictions
6. **Use Management API exclusively** for remote migrations

---

## 🔐 Security Best Practices

**All credentials must be stored in environment variables:**
- Use `.env.local` for local development
- Use `.env.production` for production (or deployment platform environment variables)
- **Never commit these files to git** - they are in `.gitignore`
- **Rotate tokens regularly** (every 90 days recommended)
- **Use separate tokens** for development and production
- **Restrict token permissions** to only what's needed
