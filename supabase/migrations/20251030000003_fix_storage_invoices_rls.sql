-- Fix storage RLS policies for project-invoices bucket to allow organization members
-- This addresses the issue where project creators without project_access records
-- cannot upload invoices to storage

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload invoices to accessible projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view invoices from accessible projects" ON storage.objects;
DROP POLICY IF EXISTS "Managers and supervisors can delete invoices" ON storage.objects;

-- Recreate upload policy with organization membership fallback
CREATE POLICY "Users can upload invoices to accessible projects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-invoices'
  AND (
    -- Check project_access first
    (storage.foldername(name))[1] IN (
      SELECT project_id::text
      FROM project_access
      WHERE user_id = auth.uid()
        AND role IN ('manager', 'supervisor')
        AND deleted_at IS NULL
    )
    OR
    -- Fallback: Check if user is org member for this project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM projects p
      INNER JOIN organization_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
        AND om.deleted_at IS NULL
        AND p.deleted_at IS NULL
    )
  )
);

-- Recreate read policy with organization membership fallback
CREATE POLICY "Users can view invoices from accessible projects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-invoices'
  AND (
    -- Check project_access first
    (storage.foldername(name))[1] IN (
      SELECT project_id::text
      FROM project_access
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
    )
    OR
    -- Fallback: Check if user is org member for this project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM projects p
      INNER JOIN organization_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
        AND om.deleted_at IS NULL
        AND p.deleted_at IS NULL
    )
  )
);

-- Recreate delete policy with organization membership fallback
CREATE POLICY "Managers and supervisors can delete invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-invoices'
  AND (
    -- Check project_access first
    (storage.foldername(name))[1] IN (
      SELECT project_id::text
      FROM project_access
      WHERE user_id = auth.uid()
        AND role IN ('manager', 'supervisor')
        AND deleted_at IS NULL
    )
    OR
    -- Fallback: Check if user is org owner for this project
    (storage.foldername(name))[1] IN (
      SELECT p.id::text
      FROM projects p
      INNER JOIN organization_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
        AND om.role = 'owner'
        AND om.deleted_at IS NULL
        AND p.deleted_at IS NULL
    )
  )
);
