# Production Supabase Link Setup

## Current Status

✅ **Access token configured**: Your AI dev can now interact with Supabase API
⚠️ **Database link pending**: Needs connection pooling enabled

---

## What's Configured

### 1. Access Token (Ready)
```bash
# Already added to .env.local
SUPABASE_ACCESS_TOKEN=sbp_96dc550ebc8f4868f18da26f685256ed9b38adfd
```

Your AI dev can now:
- ✅ List projects: `supabase projects list`
- ✅ View project details
- ✅ Manage API settings

### 2. Project Details

- **Project Name**: monday
- **Project Ref**: `tokjmeqjvexnmtampyjm`
- **Region**: East US (North Virginia)
- **Status**: ACTIVE_HEALTHY
- **Database Password**: Jay210784

---

## Issue: Connection Pooling Not Enabled

The `supabase link` command failed with:
```
FATAL: Tenant or user not found (SQLSTATE XX000)
```

This means **Connection Pooling** is not enabled on your Supabase project.

---

## How to Fix

### Step 1: Enable Connection Pooling

1. Go to: **https://app.supabase.com/project/tokjmeqjvexnmtampyjm/settings/database**
2. Scroll down to **"Connection Pooling"** section
3. Click **"Enable Connection Pooler"**
4. Select mode: **"Transaction"** (recommended for most use cases)
5. Wait 2-3 minutes for the pooler to activate

### Step 2: Link Your Project

Once connection pooling is enabled, run:

```bash
npm run db:link
```

This runs the script at `scripts/link-production.sh` which will link your local Supabase CLI to production.

### Step 3: Verify Link

```bash
supabase projects list
```

You should see `LINKED` in the first column next to your "monday" project.

---

## Alternative: Manual Link (If Pooling Can't Be Enabled)

If you can't enable connection pooling, manually create the link config:

```bash
# Create .git/config.toml
echo 'project_id = "tokjmeqjvexnmtampyjm"' > .git/config.toml
```

Then verify with:
```bash
supabase projects list
```

---

## What Your AI Dev Can Do Once Linked

### Push Migrations to Production
```bash
npm run db:push
```

This deploys all migrations from `supabase/migrations/` to your production database.

### Pull Production Schema
```bash
npm run db:pull
```

Downloads your production schema as a new migration file.

### Generate Types from Production
```bash
supabase gen types typescript --project-id tokjmeqjvexnmtampyjm > lib/types/supabase.ts
```

Creates TypeScript types matching your production database schema.

### Run Queries Against Production
```bash
supabase db psql -p tokjmeqjvexnmtampyjm
```

Opens PostgreSQL shell connected to production (use carefully!).

---

## Security Notes

### What's Safe

✅ The access token is stored in `.env.local` (gitignored)
✅ The database password is in `scripts/link-production.sh` (not committed by default)
✅ Local development uses different keys (safe defaults)

### Best Practices

1. **Never commit** `.env.local` or production credentials
2. **Use read-only queries** when testing against production
3. **Test migrations locally first**: `npm run db:reset`
4. **Only push migrations** after thorough local testing
5. **Use Supabase Studio** for ad-hoc production queries: https://app.supabase.com/project/tokjmeqjvexnmtampyjm

---

## Current Workflow

### Local Development (No Link Needed)

```bash
# 1. Start local Supabase
npm run db:start

# 2. Create migration
npm run db:migrate create_my_table

# 3. Edit: supabase/migrations/TIMESTAMP_create_my_table.sql

# 4. Apply locally
npm run db:reset

# 5. Generate types
npm run db:types
```

### Deploy to Production (After Link)

```bash
# 1. Ensure local migrations work
npm run db:reset

# 2. Push to production
npm run db:push

# 3. Generate production types
supabase gen types typescript --project-id tokjmeqjvexnmtampyjm > lib/types/supabase.ts
```

---

## Troubleshooting

### Link still failing after enabling pooling?

Wait 5 minutes after enabling the pooler, then retry:
```bash
npm run db:link
```

### Can't find connection pooling settings?

You might be on the Free plan. Connection pooling is available on:
- Pro plan and above
- OR enable it under Database → Settings → Connection Pooling

### Want to use direct connection instead?

Edit `scripts/link-production.sh` and add `--db-url` flag:
```bash
supabase link \
  --project-ref "$PROJECT_REF" \
  --db-url "postgresql://postgres.tokjmeqjvexnmtampyjm:$DB_PASSWORD@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres"
```

---

## Quick Reference

```bash
# Link to production
npm run db:link

# Check link status
supabase projects list

# Push migrations
npm run db:push

# Pull schema
npm run db:pull

# Generate types
npm run db:types

# Open production DB shell
supabase db psql -p tokjmeqjvexnmtampyjm
```

---

## Next Steps

1. ✅ Enable connection pooling in Supabase dashboard
2. ✅ Run `npm run db:link` to link your project
3. ✅ Test by running `supabase projects list` (should show LINKED)
4. ✅ Push your local migrations: `npm run db:push`
5. ✅ Generate production types: `npm run db:types`

Once linked, your AI dev can seamlessly deploy database changes to production! 🚀
