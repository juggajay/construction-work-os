-- Migration: Create Storage Bucket for Daily Report Photos
-- Created: 2025-01-22
-- Description: Creates storage bucket and RLS policies for daily report photo uploads

-- UP Migration

-- Create storage bucket for daily report photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'daily-report-photos',
  'daily-report-photos',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload photos to their accessible projects
CREATE POLICY "Users can upload daily report photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'daily-report-photos'
    AND (storage.foldername(name))[1] = 'daily-reports'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
    )
  );

-- Policy: Users can view photos in accessible projects
CREATE POLICY "Users can view daily report photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'daily-report-photos'
    AND (storage.foldername(name))[1] = 'daily-reports'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
    )
  );

-- Policy: Users can delete photos from their draft reports
CREATE POLICY "Users can delete daily report photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'daily-report-photos'
    AND (storage.foldername(name))[1] = 'daily-reports'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Users can delete daily report photos" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can view daily report photos" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can upload daily report photos" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'daily-report-photos';
