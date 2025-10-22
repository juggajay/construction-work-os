-- Migration: Create Daily Report Attachments Table
-- Created: 2025-01-22
-- Description: Track photos and documents with EXIF metadata and GPS coordinates

-- UP Migration

CREATE TABLE IF NOT EXISTS daily_report_attachments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),

  -- File details
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- bytes
  file_type TEXT NOT NULL, -- MIME type
  attachment_type attachment_type NOT NULL DEFAULT 'photo',
  description TEXT, -- user-provided description

  -- EXIF metadata (from photos)
  gps_latitude NUMERIC(10,7), -- decimal degrees, e.g., 37.7749000
  gps_longitude NUMERIC(10,7), -- decimal degrees, e.g., -122.4194000
  captured_at TIMESTAMPTZ, -- from EXIF DateTimeOriginal or upload time

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT file_size_positive_check CHECK (file_size > 0),
  CONSTRAINT gps_latitude_range_check CHECK (
    gps_latitude IS NULL OR
    (gps_latitude >= -90 AND gps_latitude <= 90)
  ),
  CONSTRAINT gps_longitude_range_check CHECK (
    gps_longitude IS NULL OR
    (gps_longitude >= -180 AND gps_longitude <= 180)
  )
);

-- Indexes

-- Primary lookup: all attachments for a daily report
CREATE INDEX attachments_report_idx
  ON daily_report_attachments(daily_report_id);

-- Filter by attachment type (photos vs documents)
CREATE INDEX attachments_type_idx
  ON daily_report_attachments(daily_report_id, attachment_type);

-- GPS-tagged photos (for mapping)
CREATE INDEX attachments_gps_idx
  ON daily_report_attachments(daily_report_id, gps_latitude, gps_longitude)
  WHERE gps_latitude IS NOT NULL AND gps_longitude IS NOT NULL;

-- DOWN Migration (Rollback)
-- DROP INDEX IF EXISTS attachments_gps_idx;
-- DROP INDEX IF EXISTS attachments_type_idx;
-- DROP INDEX IF EXISTS attachments_report_idx;
-- DROP TABLE IF EXISTS daily_report_attachments;
