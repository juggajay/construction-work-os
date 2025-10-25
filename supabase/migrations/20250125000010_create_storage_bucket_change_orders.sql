-- Migration: Create Storage Bucket for Change Orders
-- Created: 2025-01-25
-- Description: Supabase Storage bucket for change order attachments

-- ============================================================================
-- CREATE STORAGE BUCKET
-- ============================================================================

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('change-order-attachments', 'change-order-attachments')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Note: Storage policies must be created via Supabase Dashboard due to API permissions
-- Go to: Storage > change-order-attachments > Policies
--
-- Policy 1: "Users can view change order attachments for their projects"
--   Operation: SELECT
--   Policy:
--     bucket_id = 'change-order-attachments'
--     AND (storage.foldername(name))[1] IN (
--       SELECT p.id::TEXT
--       FROM projects p
--       INNER JOIN organization_members om ON om.org_id = p.org_id
--       WHERE om.user_id = auth.uid()
--     )
--
-- Policy 2: "Users can upload change order attachments for their projects"
--   Operation: INSERT
--   Policy: (same as above)
--
-- Policy 3: "Users can update their own attachments"
--   Operation: UPDATE
--   Policy: bucket_id = 'change-order-attachments' AND owner = auth.uid()
--
-- Policy 4: "Users can delete their own attachments"
--   Operation: DELETE
--   Policy: bucket_id = 'change-order-attachments' AND owner = auth.uid()

-- ============================================================================
-- STORAGE STRUCTURE
-- ============================================================================

-- Files will be organized as:
-- change-order-attachments/
--   {project_id}/
--     {change_order_id}/
--       {filename}
--
-- Example: change-order-attachments/123e4567-e89b-12d3-a456-426614174000/456e7890-e89b-12d3-a456-426614174001/quote.pdf

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- DELETE FROM storage.buckets WHERE id = 'change-order-attachments';
