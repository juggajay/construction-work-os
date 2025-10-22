-- Migration: Create Submittal Attachments Table
-- Created: 2025-01-23
-- Task: 1.5 - Create Submittal Attachments Schema Migration
-- Purpose: Track file attachments for submittals with version-specific organization

-- UP Migration

-- Create submittal_attachment_type enum
CREATE TYPE submittal_attachment_type AS ENUM (
  'product_data',
  'shop_drawing',
  'sample_photo',
  'specification',
  'other'
);

-- Create submittal_attachments table
CREATE TABLE IF NOT EXISTS submittal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to submittal
  submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,

  -- Version-specific attachment
  version_number INTEGER NOT NULL CHECK (version_number >= 0),

  -- File information
  file_path TEXT NOT NULL,  -- Supabase Storage path: /submittals/{project_id}/{submittal_id}/{version}/{filename}
  file_name TEXT NOT NULL,  -- Original filename
  file_size BIGINT NOT NULL CHECK (file_size > 0),  -- Size in bytes
  file_type TEXT NOT NULL,  -- MIME type (e.g., "application/pdf", "image/jpeg")

  -- Attachment categorization
  attachment_type submittal_attachment_type NOT NULL,

  -- User tracking
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_submittal_attachments_submittal_id
  ON submittal_attachments(submittal_id);

-- Composite index for finding attachments by submittal and version
CREATE INDEX IF NOT EXISTS idx_submittal_attachments_submittal_version
  ON submittal_attachments(submittal_id, version_number);

CREATE INDEX IF NOT EXISTS idx_submittal_attachments_type
  ON submittal_attachments(attachment_type);

CREATE INDEX IF NOT EXISTS idx_submittal_attachments_uploaded_by
  ON submittal_attachments(uploaded_by);

-- Comments for documentation
COMMENT ON TABLE submittal_attachments IS 'File attachments for submittals, organized by version';
COMMENT ON COLUMN submittal_attachments.version_number IS 'Version of submittal this attachment belongs to (0=Rev 0, 1=Rev A, etc.)';
COMMENT ON COLUMN submittal_attachments.file_path IS 'Storage path in Supabase Storage';
COMMENT ON COLUMN submittal_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN submittal_attachments.attachment_type IS 'Type of attachment: product_data, shop_drawing, sample_photo, specification, or other';

-- DOWN Migration (Rollback)
-- DROP INDEX IF EXISTS idx_submittal_attachments_uploaded_by;
-- DROP INDEX IF EXISTS idx_submittal_attachments_type;
-- DROP INDEX IF EXISTS idx_submittal_attachments_submittal_version;
-- DROP INDEX IF EXISTS idx_submittal_attachments_submittal_id;
-- DROP TABLE IF EXISTS submittal_attachments CASCADE;
-- DROP TYPE IF EXISTS submittal_attachment_type CASCADE;
