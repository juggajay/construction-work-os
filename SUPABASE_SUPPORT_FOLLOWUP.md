# Follow-Up Required: Storage Schema Still Broken

## Response to Supabase Support

Thank you for your quick response! However, the issue is **not resolved yet**.

After you recreated the Storage tenant, I'm still seeing the same errors:

### Error 1: Dashboard Cannot Load
The Supabase Dashboard Storage page still shows:
```
Failed to fetch buckets
Error: select "id", "name", "public", "owner", "created_at", "updated_at",
"file_size_limit", "allowed_mime_types" from "buckets"
- column "public" does not exist
```

### Error 2: Invoice Upload Still Fails
When attempting to upload files, the error is:
```
StorageApiError: select "id", "file_size_limit", "allowed_mime_types"
from "buckets" where "id" = $1 limit $2
- column "file_size_limit" does not exist
```

## The Problem

The `storage.buckets` table **schema** was not updated. The table still only has these columns:
- `id`
- `name`
- `owner`
- `created_at`
- `updated_at`

But it's **missing** these required columns:
- `public` (boolean)
- `file_size_limit` (bigint)
- `allowed_mime_types` (text[])
- `avif_autodetection` (boolean)

## What's Needed

The storage tenant recreation cleared the buckets (data), but didn't update the table **schema**. You need to run a schema migration with superuser access:

```sql
-- Add missing columns to storage.buckets table
ALTER TABLE storage.buckets
ADD COLUMN IF NOT EXISTS public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS file_size_limit bigint,
ADD COLUMN IF NOT EXISTS allowed_mime_types text[],
ADD COLUMN IF NOT EXISTS avif_autodetection boolean DEFAULT false;
```

## Verification

After applying this migration, please verify by running:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'storage'
  AND table_name = 'buckets'
ORDER BY ordinal_position;
```

Expected result should include all 9 columns:
1. id
2. name
3. owner
4. created_at
5. updated_at
6. public
7. file_size_limit
8. allowed_mime_types
9. avif_autodetection

## Project Details

- **Project Reference**: tokjmeqjvexnmtampyjm
- **Project Name**: monday
- **Dashboard Error**: Storage page shows "Failed to fetch buckets"
- **API Error**: Invoice uploads fail with "column does not exist"

## Impact

**Critical**:
- Cannot use Supabase Storage Dashboard at all
- Cannot upload invoices (core feature)
- Affects all storage buckets in the project

## Timeline

This is blocking a production feature (invoice uploads). Any expedited assistance would be greatly appreciated.

Thank you!
