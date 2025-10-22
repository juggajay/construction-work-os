-- Migration: Create Supabase Storage Bucket for Submittals
-- Created: 2025-01-23
-- Purpose: Create storage bucket for submittal attachments with proper access policies

-- UP Migration

-- Create submittals storage bucket
-- Note: File size limits and MIME type restrictions can be configured via Supabase Dashboard
INSERT INTO storage.buckets (id, name)
VALUES ('submittals', 'submittals')
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for submittals bucket
-- NOTE: These need to be created via Supabase Dashboard → Storage → submittals → Policies
-- due to permission requirements on storage.objects table

-- Policy 1: SELECT - "Users can view submittal files in accessible projects"
-- Target: SELECT on storage.objects
-- Definition:
--   bucket_id = 'submittals' AND
--   (string_to_array(name, '/'))[1]::uuid IN (SELECT project_id FROM user_project_ids())

-- Policy 2: INSERT - "Users can upload files to submittals in accessible projects"
-- Target: INSERT on storage.objects
-- Definition:
--   bucket_id = 'submittals' AND
--   (string_to_array(name, '/'))[1]::uuid IN (SELECT project_id FROM user_project_ids())

-- Policy 3: DELETE - "Users can delete files from their submittals"
-- Target: DELETE on storage.objects
-- Definition:
--   bucket_id = 'submittals' AND
--   (string_to_array(name, '/'))[1]::uuid IN (SELECT project_id FROM user_project_ids())

-- DOWN Migration (Rollback)
-- DELETE FROM storage.buckets WHERE id = 'submittals';
