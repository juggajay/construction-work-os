# Upload Invoice Button Fix

## Issue Found

The upload invoice button **IS WORKING CORRECTLY**!

### What Was Wrong
Users thought the button wasn't working because it was **disabled by design** until all required fields are filled:
1. ✅ File must be selected
2. ✅ Category must be selected (Labor/Materials/Equipment/Other)
3. ✅ Amount must be entered (greater than 0)

### The Real Problem
When the button is clicked with all fields filled, the upload fails with this error:
```
StorageApiError: column "file_size_limit" does not exist
```

## Root Cause

**Schema Version Mismatch:**
- **Client**: Using `@supabase/supabase-js` v2.75.1 (newer, expects `file_size_limit` and `allowed_mime_types` columns)
- **Database**: Running older Supabase storage schema (missing these columns)

All storage buckets in the database are affected:
- `submittals`
- `change-order-attachments`
- `project-invoices`
- `project-quotes`

## Solutions

### Option 1: Migrate Storage Schema (RECOMMENDED)

**Method A: Using Supabase CLI**
```bash
# Pull latest schema from Supabase
supabase db pull

# This should create a migration with the storage schema updates
# Then push it back
supabase db push
```

**Method B: Manual SQL Migration (if you have superuser access)**

Contact Supabase support or use a superuser connection to run:
```sql
ALTER TABLE storage.buckets
ADD COLUMN IF NOT EXISTS file_size_limit bigint,
ADD COLUMN IF NOT EXISTS allowed_mime_types text[],
ADD COLUMN IF NOT EXISTS public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS avif_autodetection boolean DEFAULT false;

-- Update project-invoices bucket
UPDATE storage.buckets
SET
  file_size_limit = 26214400,  -- 25MB
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic'],
  public = false
WHERE id = 'project-invoices';
```

**Method C: Recreate Bucket via Dashboard**

1. Go to: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/storage/buckets
2. Delete the `project-invoices` bucket (make sure no data will be lost)
3. Recreate it with:
   - Name: `project-invoices`
   - Public: No
   - File size limit: 26214400 (25MB)
   - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/heic`
4. Re-add the RLS policies (see INVOICE_STORAGE_SETUP.md)

### Option 2: Downgrade Supabase Client (TEMPORARY WORKAROUND)

Downgrade to an older version that matches your database schema:
```bash
npm install @supabase/supabase-js@2.38.0
```

**Warning**: This is a temporary workaround and you'll miss out on newer features/fixes.

## Testing Steps

After applying the fix:

1. Navigate to: `http://localhost:3000/{orgSlug}/projects/{projectId}/costs/upload-invoice`
2. Select a file (PDF, JPG, PNG, or HEIC)
3. Select a category
4. Enter an amount
5. Click "Upload Invoice"
6. You should see "Uploading..." then success!

## Logs from Successful Test

The upload button worked perfectly in testing:
```
📤 uploadInvoice: Starting upload process
📤 uploadInvoice: Extracted data: {...}
📤 uploadInvoice: User authenticated
📤 uploadInvoice: Access verified, role: manager
📤 uploadInvoice: Uploading file to storage
❌ uploadInvoice: File upload failed: column "file_size_limit" does not exist
```

Everything worked until the storage API tried to query the missing columns.

## Recommendation

**Use Option 1, Method C** (Recreate bucket via Dashboard) - it's the safest and most reliable approach for hosted Supabase instances.
