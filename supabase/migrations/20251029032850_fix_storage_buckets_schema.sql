-- Fix storage.buckets schema - add missing columns required by Supabase Storage API
-- This fixes the error: "column file_size_limit does not exist"

-- Add missing columns to storage.buckets table
ALTER TABLE storage.buckets
ADD COLUMN IF NOT EXISTS file_size_limit bigint,
ADD COLUMN IF NOT EXISTS allowed_mime_types text[],
ADD COLUMN IF NOT EXISTS public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS avif_autodetection boolean DEFAULT false;

-- Update existing project-invoices bucket with proper configuration
UPDATE storage.buckets
SET
  file_size_limit = 26214400,  -- 25MB in bytes
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic']::text[],
  public = false
WHERE id = 'project-invoices';

-- Update other buckets with reasonable defaults
UPDATE storage.buckets
SET
  file_size_limit = COALESCE(file_size_limit, 52428800),  -- Default 50MB if not set
  public = COALESCE(public, false),
  avif_autodetection = COALESCE(avif_autodetection, false)
WHERE file_size_limit IS NULL;

-- Verify the changes
SELECT id, name, file_size_limit, allowed_mime_types, public
FROM storage.buckets
ORDER BY created_at;
