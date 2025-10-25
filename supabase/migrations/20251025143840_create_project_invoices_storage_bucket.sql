/**
 * Create project-invoices storage bucket
 * This bucket stores uploaded invoice files (PDF, images) for project cost tracking
 */

-- Create the storage bucket (file_size_limit and allowed_mime_types don't exist in older Supabase versions)
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
