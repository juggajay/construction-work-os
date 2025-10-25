-- ============================================================================
-- Storage Bucket Migration: Create project-invoices bucket
-- ============================================================================
-- Apply this in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/sql/new
--
-- Just copy this entire file and click "Run"
-- ============================================================================

-- Create the storage bucket (using only columns that exist)
INSERT INTO storage.buckets (id, name)
VALUES ('project-invoices', 'project-invoices')
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow authenticated users to upload invoices to their projects
CREATE POLICY "Users can upload invoices to accessible projects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-invoices'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_access
    WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
  )
);

-- RLS Policy: Allow users to read invoices from their accessible projects
CREATE POLICY "Users can view invoices from accessible projects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-invoices'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_access
    WHERE user_id = auth.uid()
      AND deleted_at IS NULL
  )
);

-- RLS Policy: Allow users to delete invoices from their accessible projects (managers/supervisors only)
CREATE POLICY "Managers and supervisors can delete invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-invoices'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_access
    WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
  )
);

-- ============================================================================
-- DONE! The project-invoices bucket is now ready for invoice uploads
-- ============================================================================
