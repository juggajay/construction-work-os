-- Add missing columns to storage.buckets table
-- These columns are required by newer versions of the Supabase SDK

-- Add file_size_limit column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage'
    AND table_name = 'buckets'
    AND column_name = 'file_size_limit'
  ) THEN
    ALTER TABLE storage.buckets ADD COLUMN file_size_limit bigint;
  END IF;
END $$;

-- Add allowed_mime_types column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage'
    AND table_name = 'buckets'
    AND column_name = 'allowed_mime_types'
  ) THEN
    ALTER TABLE storage.buckets ADD COLUMN allowed_mime_types text[];
  END IF;
END $$;

-- Add avif_autodetection column if it doesn't exist (used in newer versions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage'
    AND table_name = 'buckets'
    AND column_name = 'avif_autodetection'
  ) THEN
    ALTER TABLE storage.buckets ADD COLUMN avif_autodetection boolean DEFAULT false;
  END IF;
END $$;
