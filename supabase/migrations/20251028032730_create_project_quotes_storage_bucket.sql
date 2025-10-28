/**
 * Create project-quotes storage bucket
 * This bucket stores uploaded quote documents (PDF, images) for budget allocations
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

-- Create the storage bucket
INSERT INTO storage.buckets (id, name)
VALUES ('project-quotes', 'project-quotes')
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow managers and supervisors to upload quotes to their projects
CREATE POLICY "Managers and supervisors can upload quotes to accessible projects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-quotes'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_access
    WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
  )
);

-- RLS Policy: Allow all team members to view quotes from their accessible projects
CREATE POLICY "Users can view quotes from accessible projects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-quotes'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_access
    WHERE user_id = auth.uid()
      AND deleted_at IS NULL
  )
);

-- RLS Policy: Only managers can delete quotes
CREATE POLICY "Managers can delete quotes from their projects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-quotes'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_access
    WHERE user_id = auth.uid()
      AND role = 'manager'
      AND deleted_at IS NULL
  )
);

-- RLS Policy: Allow managers and supervisors to update quote files
CREATE POLICY "Managers and supervisors can update quotes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-quotes'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text
    FROM project_access
    WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
  )
);
