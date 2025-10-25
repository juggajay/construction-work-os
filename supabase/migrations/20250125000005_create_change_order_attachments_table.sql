-- Migration: Create Change Order Attachments Table
-- Created: 2025-01-25
-- Description: Supporting documents for change orders

CREATE TABLE change_order_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- Bytes
  file_type TEXT, -- MIME type
  category attachment_category NOT NULL DEFAULT 'other',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT file_size_reasonable CHECK (file_size > 0 AND file_size <= 52428800) -- Max 50MB
);

CREATE INDEX idx_attachments_change_order_id ON change_order_attachments(change_order_id);
CREATE INDEX idx_attachments_category ON change_order_attachments(change_order_id, category);
CREATE INDEX idx_attachments_uploaded_by ON change_order_attachments(uploaded_by);

COMMENT ON TABLE change_order_attachments IS 'Supporting documents (quotes, drawings, photos, contracts) for change orders';
COMMENT ON COLUMN change_order_attachments.category IS 'Document category: quote, drawing, photo, contract, other';
