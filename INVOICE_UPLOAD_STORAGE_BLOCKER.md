# Invoice Upload - Storage Schema Version Blocker

## Issue Summary
Invoice upload functionality is **blocked** by a storage schema version mismatch between the local Supabase SDK and the remote Supabase instance.

## Error Details
```
DatabaseError: select "id", "file_size_limit", "allowed_mime_types" from "buckets" where "id" = $1 limit $2
- column "file_size_limit" does not exist
```

## Root Cause
The remote Supabase instance is running an **older version** of the storage schema that doesn't include these columns:
- `file_size_limit` (bigint)
- `allowed_mime_types` (text[])
- `avif_autodetection` (boolean)

The newer Supabase Storage SDK (`@supabase/storage-js`) expects these columns to exist in `storage.buckets` table.

## What Was Fixed
During this session, we successfully fixed **THREE** permission issues:

### 1. Budget Allocations Server Action ✅
- **File**: `lib/actions/budgets/update-budget-allocation.ts`
- **Fix**: Added organization membership fallback when `project_access` record doesn't exist
- **Status**: Working

### 2. Budget Allocations RLS Policies ✅
- **Migration**: `supabase/migrations/20251030000001_fix_project_budgets_rls.sql`
- **Fix**: Updated INSERT, UPDATE, DELETE policies on `project_budgets` table
- **Status**: Applied to production

### 3. Invoice Upload Server Action ✅
- **File**: `lib/actions/invoices/upload-invoice.ts`
- **Fix**: Added organization membership fallback
- **Status**: Partially working (auth passes, storage fails)

### 4. Invoice Upload RLS Policies ✅
- **Migration**: `supabase/migrations/20251030000002_fix_project_invoices_rls.sql`
- **Fix**: Updated INSERT, UPDATE, DELETE policies on `project_invoices` table
- **Status**: Applied to production

### 5. Storage Object RLS Policies ✅
- **Migration**: `supabase/migrations/20251030000003_fix_storage_invoices_rls.sql`
- **Fix**: Updated INSERT, SELECT, DELETE policies on `storage.objects`
- **Status**: Applied to production

### 6. Storage Bucket Creation ✅
- **Migration**: `supabase/migrations/20251030000004_ensure_storage_bucket_exists.sql`
- **Fix**: Ensured `project-invoices` bucket exists
- **Status**: Applied to production

## What's Blocked
**Storage upload** - The Supabase SDK cannot upload files because it queries columns that don't exist in the remote storage.buckets table.

## Solutions

### Option 1: Upgrade Supabase Instance (Recommended)
Contact Supabase support to upgrade the remote instance to the latest version. This will add the missing columns to the storage schema.

**Steps**:
1. Log into Supabase dashboard
2. Go to Project Settings → General
3. Check the "Postgres version" and "Storage version"
4. If outdated, upgrade via Settings or contact support

### Option 2: Downgrade Storage SDK
Temporarily downgrade `@supabase/storage-js` to a version compatible with the older storage schema.

**Steps**:
```bash
npm install @supabase/storage-js@2.5.5
```

Note: This may introduce other compatibility issues.

### Option 3: Use Direct REST API
Bypass the SDK and upload files directly to Supabase Storage REST API.

**Steps**:
1. Modify `lib/actions/invoices/upload-invoice.ts`
2. Replace `supabase.storage.from('project-invoices').upload()` with direct fetch call
3. Use REST endpoint: `POST https://{project-ref}.supabase.co/storage/v1/object/{bucket-name}/{file-path}`

## Recommendation
**Option 1 (Upgrade Supabase Instance)** is the best long-term solution. The RLS policies and server actions are now fixed and working - only the storage schema version is blocking uploads.

## Testing Status
- ✅ Budget allocation save: **Working**
- ✅ Budget allocation display: **Working**
- ✅ Invoice upload authentication: **Working**
- ❌ Invoice upload storage: **Blocked by schema version**

## Next Steps
1. Upgrade the remote Supabase instance
2. Retry invoice upload test
3. Verify invoice appears on Costs page
