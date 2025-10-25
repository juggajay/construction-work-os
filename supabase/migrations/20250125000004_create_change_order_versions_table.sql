-- Migration: Create Change Order Versions Table
-- Created: 2025-01-25
-- Description: Version history for change order negotiations

CREATE TABLE change_order_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_order_id UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL, -- Why this version was created
  cost_impact DECIMAL(15, 2) DEFAULT 0, -- Snapshot of cost at this version
  schedule_impact_days INTEGER DEFAULT 0, -- Snapshot of schedule impact
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_version_per_co UNIQUE (change_order_id, version_number),
  CONSTRAINT version_number_positive CHECK (version_number > 0)
);

CREATE INDEX idx_versions_change_order_id ON change_order_versions(change_order_id);
CREATE INDEX idx_versions_change_order_version ON change_order_versions(change_order_id, version_number);

COMMENT ON TABLE change_order_versions IS 'Version history for change order negotiations and revisions';
COMMENT ON COLUMN change_order_versions.reason IS 'Explanation for why this version was created (e.g., "Owner requested price reduction")';
