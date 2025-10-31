# Invoice Storage Bucket Setup Guide

The `project-invoices` storage bucket **must** be created through the Supabase Dashboard (not via SQL migrations) to properly initialize the Storage API service.

## Step 1: Create the Bucket

1. Go to: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/storage/buckets
2. Click **"New bucket"**
3. Configure:
   - **Name**: `project-invoices`
   - **Public**: No (keep private)
   - **File size limit**: `26214400` (25MB)
   - **Allowed MIME types**: `application/pdf`, `image/jpeg`, `image/png`, `image/heic`
4. Click **"Create bucket"**

## Step 2: Add RLS Policies

After creating the bucket, click on it and go to the **"Policies"** tab.

### Policy 1: Upload Invoices
- **Name**: `Users can upload invoices to accessible projects`
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(
  bucket_id = 'project-invoices'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_access
    WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
  )
)
```

### Policy 2: View Invoices
- **Name**: `Users can view invoices from accessible projects`
- **Operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(
  bucket_id = 'project-invoices'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_access
    WHERE user_id = auth.uid()
      AND deleted_at IS NULL
  )
)
```

### Policy 3: Delete Invoices
- **Name**: `Managers and supervisors can delete invoices`
- **Operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(
  bucket_id = 'project-invoices'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_access
    WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
  )
)
```

## Step 3: Test

After setup, test the invoice upload feature at:
https://construction-work-os.vercel.app/{orgSlug}/projects/{projectId}/costs/upload-invoice

## File Structure

Invoices are stored as:
```
project-invoices/{project_id}/{invoice_id}_{filename}
```

Example:
```
project-invoices/b694bd30-93d0-41dc-bda6-aadc9fa3ca57/123e4567_construction_invoice.pdf
```

## Why Dashboard Creation?

Creating the bucket via SQL (`INSERT INTO storage.buckets`) only creates the database record. Supabase's Storage API requires additional initialization that only happens when created through the Dashboard or Admin API, including:
- Tenant configuration setup
- Storage backend initialization
- S3/storage service registration

The error "Missing tenant config for tenant tokjmeqjvexnmtampyjm" occurs when this initialization is skipped.
