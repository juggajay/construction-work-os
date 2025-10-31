# URGENT: Supabase Support Required

## Critical Issue Found

Your Supabase project's storage schema is **severely outdated** and needs immediate attention from Supabase support.

## The Problem

The `storage.buckets` table is missing critical columns that both:
1. The Supabase Storage API requires
2. The Supabase Dashboard requires

**Missing columns**:
- `public` (boolean)
- `file_size_limit` (bigint)
- `allowed_mime_types` (text[])
- `avif_autodetection` (boolean)

**Impact**:
- ❌ Invoice uploads fail with: `column "file_size_limit" does not exist`
- ❌ Supabase Dashboard can't load: `column "public" does not exist`
- ❌ Cannot manage storage buckets through UI
- ❌ All 4 storage buckets are affected (submittals, change-order-attachments, project-invoices, project-quotes)

## What We Tried

1. ✅ Verified upload button works perfectly (button is fine!)
2. ❌ Attempted SQL migration - Blocked: requires superuser access to system tables
3. ❌ Attempted Management API migration - Blocked: permission denied
4. ❌ Attempted direct PostgreSQL connection - Blocked: permission denied
5. ❌ Attempted client downgrade - Didn't help: server-side API still queries missing columns
6. ❌ Attempted dashboard bucket recreation - Blocked: dashboard can't even load buckets

## Action Required

**Contact Supabase Support Immediately**:

1. **Open support ticket**: https://supabase.com/dashboard/support/new

2. **Provide this information**:
   ```
   Project Reference: tokjmeqjvexnmtampyjm
   Project Name: monday
   Issue: Storage buckets table missing required schema columns

   Error 1 (Upload fails):
   select "id", "file_size_limit", "allowed_mime_types" from "buckets"
   where "id" = $1 limit $2 - column "file_size_limit" does not exist

   Error 2 (Dashboard fails):
   select "id", "name", "public", "owner", "created_at", "updated_at",
   "file_size_limit", "allowed_mime_types" from "buckets"
   - column "public" does not exist

   Current schema only has: id, name, owner, created_at, updated_at

   Required schema needs: id, name, public, owner, created_at, updated_at,
   file_size_limit, allowed_mime_types, avif_autodetection
   ```

3. **Request**: Storage schema migration to add missing columns with superuser access

4. **Migration SQL** (for their reference):
   ```sql
   ALTER TABLE storage.buckets
   ADD COLUMN IF NOT EXISTS public boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS file_size_limit bigint,
   ADD COLUMN IF NOT EXISTS allowed_mime_types text[],
   ADD COLUMN IF NOT EXISTS avif_autodetection boolean DEFAULT false;

   -- Set defaults for existing buckets
   UPDATE storage.buckets
   SET
     public = false,
     file_size_limit = 52428800,  -- 50MB default
     avif_autodetection = false
   WHERE public IS NULL;

   -- Set specific config for project-invoices
   UPDATE storage.buckets
   SET
     file_size_limit = 26214400,  -- 25MB
     allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic']::text[]
   WHERE id = 'project-invoices';
   ```

## Temporary Workaround

While waiting for Supabase support, invoice uploads will continue to fail. You can:

**Option A**: Wait for support (RECOMMENDED)
- Safest option
- Fixes all buckets permanently
- Usually responds within 24-48 hours

**Option B**: Disable invoice uploads temporarily
- Comment out the upload route or add a maintenance message
- Prevents user frustration from failed uploads

## Files for Reference

Share these files with Supabase support if helpful:
- `INVOICE_UPLOAD_COMPLETE_DIAGNOSIS.md` - Full investigation details
- `supabase/migrations/20251029032850_fix_storage_buckets_schema.sql` - Migration we tried to apply
- `scripts/check-bucket-schema.js` - Script to verify current schema

## Testing After Fix

Once Supabase support fixes the schema, test with:

```bash
# Verify columns exist
node scripts/check-bucket-schema.js

# Test upload
# Navigate to: /{orgSlug}/projects/{projectId}/costs/upload-invoice
# Upload a PDF with category and amount filled
# Should succeed!
```

## Expected Timeline

- **Support Response**: 6-48 hours
- **Fix Application**: 15-30 minutes after support responds
- **Testing**: 5 minutes

## Priority Level

**HIGH** - Affects core functionality (invoice uploads) and prevents dashboard management of storage.

---

## Update Log

**2025-10-29**:
- Discovered upload button works perfectly ✅
- Identified storage schema is outdated ❌
- Confirmed dashboard can't load buckets ❌
- Attempted 6 different fix approaches - all blocked by permissions ❌
- **Recommendation**: Contact Supabase support immediately
