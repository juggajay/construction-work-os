-- Migration: Add Project Cost Tracking & Forecasting System
-- Created: 2025-10-25
-- Description: Implements budget allocation, invoice management, manual cost tracking,
--              burn rate forecasting, and portfolio-level financial visibility

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Budget category enum
CREATE TYPE project_budget_category AS ENUM ('labor', 'materials', 'equipment', 'other');

-- Invoice status enum
CREATE TYPE invoice_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

-- =============================================================================
-- TABLES
-- =============================================================================

-- 1. project_budgets: Budget allocations per category
CREATE TABLE project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category project_budget_category NOT NULL,
  allocated_amount DECIMAL(15, 2) NOT NULL CHECK (allocated_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for project_budgets
CREATE INDEX idx_project_budgets_project ON project_budgets(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_budgets_category ON project_budgets(category) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_project_budgets_unique_category ON project_budgets(project_id, category) WHERE deleted_at IS NULL;

-- 2. project_invoices: Invoice files and metadata
CREATE TABLE project_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_category project_budget_category NOT NULL,

  -- File storage
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,

  -- Invoice details (AI-parsed or manually entered)
  vendor_name TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,

  -- AI parsing metadata
  ai_parsed BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  ai_raw_response JSONB, -- Store full OpenAI response for audit

  -- Approval workflow
  status invoice_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Audit
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for project_invoices
CREATE INDEX idx_invoices_project ON project_invoices(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON project_invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_date ON project_invoices(invoice_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_category ON project_invoices(budget_category) WHERE deleted_at IS NULL;

-- 3. project_costs: Manual cost entries
CREATE TABLE project_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_category project_budget_category NOT NULL,

  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  cost_date DATE NOT NULL,

  -- Optional attachments (receipts, photos)
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of {file_path, file_name}

  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for project_costs
CREATE INDEX idx_costs_project ON project_costs(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_costs_date ON project_costs(cost_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_costs_category ON project_costs(budget_category) WHERE deleted_at IS NULL;

-- 4. project_budget_history: Audit trail for budget changes
CREATE TABLE project_budget_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_budget_id UUID NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
  old_amount DECIMAL(15, 2),
  new_amount DECIMAL(15, 2) NOT NULL,
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for project_budget_history
CREATE INDEX idx_budget_history_budget ON project_budget_history(project_budget_id);
CREATE INDEX idx_budget_history_date ON project_budget_history(changed_at DESC);

-- =============================================================================
-- MATERIALIZED VIEW
-- =============================================================================

-- Pre-aggregated cost data for fast dashboard queries
CREATE MATERIALIZED VIEW project_cost_summary AS
SELECT
  p.id AS project_id,
  p.budget AS total_budget,
  b.category,
  b.allocated_amount,
  COALESCE(spent.amount, 0) AS spent_amount,
  b.allocated_amount - COALESCE(spent.amount, 0) AS remaining_amount,
  CASE
    WHEN b.allocated_amount > 0
    THEN (COALESCE(spent.amount, 0) / b.allocated_amount * 100)
    ELSE 0
  END AS spent_percentage
FROM projects p
JOIN project_budgets b ON p.id = b.project_id
LEFT JOIN (
  SELECT
    project_id,
    budget_category,
    SUM(amount) AS amount
  FROM (
    SELECT project_id, budget_category, amount
    FROM project_invoices
    WHERE status = 'approved' AND deleted_at IS NULL
    UNION ALL
    SELECT project_id, budget_category, amount
    FROM project_costs
    WHERE deleted_at IS NULL
  ) costs
  GROUP BY project_id, budget_category
) spent ON p.id = spent.project_id AND b.category = spent.budget_category
WHERE p.deleted_at IS NULL AND b.deleted_at IS NULL;

-- Indexes for materialized view
CREATE UNIQUE INDEX idx_cost_summary_project_category ON project_cost_summary(project_id, category);
CREATE INDEX idx_cost_summary_project ON project_cost_summary(project_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_cost_summary()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY project_cost_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate burn rate and forecast
CREATE OR REPLACE FUNCTION calculate_burn_rate(p_project_id UUID)
RETURNS TABLE (
  days_elapsed INTEGER,
  days_total INTEGER,
  days_remaining INTEGER,
  total_spent DECIMAL(15, 2),
  daily_burn_rate DECIMAL(15, 2),
  forecasted_total DECIMAL(15, 2),
  forecasted_overrun DECIMAL(15, 2),
  status TEXT -- 'on_track', 'warning', 'critical'
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_budget DECIMAL(15, 2);
BEGIN
  -- Get project timeline and budget
  SELECT start_date, end_date, budget
  INTO v_start_date, v_end_date, v_budget
  FROM projects
  WHERE id = p_project_id AND deleted_at IS NULL;

  -- Calculate days
  days_elapsed := GREATEST(0, CURRENT_DATE - v_start_date);
  days_total := GREATEST(1, v_end_date - v_start_date);
  days_remaining := GREATEST(0, v_end_date - CURRENT_DATE);

  -- Get total spent
  SELECT COALESCE(SUM(spent_amount), 0)
  INTO total_spent
  FROM project_cost_summary
  WHERE project_id = p_project_id;

  -- Calculate burn rate and forecast
  IF days_elapsed > 0 THEN
    daily_burn_rate := total_spent / days_elapsed;
    forecasted_total := total_spent + (daily_burn_rate * days_remaining);
  ELSE
    daily_burn_rate := 0;
    forecasted_total := 0;
  END IF;

  forecasted_overrun := forecasted_total - v_budget;

  -- Determine status
  IF forecasted_total <= v_budget * 1.10 THEN
    status := 'on_track';
  ELSIF forecasted_total <= v_budget * 1.25 THEN
    status := 'warning';
  ELSE
    status := 'critical';
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-refresh materialized view on invoice changes
CREATE TRIGGER refresh_cost_summary_on_invoice
AFTER INSERT OR UPDATE OR DELETE ON project_invoices
FOR EACH STATEMENT EXECUTE FUNCTION refresh_cost_summary();

-- Auto-refresh materialized view on cost changes
CREATE TRIGGER refresh_cost_summary_on_cost
AFTER INSERT OR UPDATE OR DELETE ON project_costs
FOR EACH STATEMENT EXECUTE FUNCTION refresh_cost_summary();

-- Trigger to update updated_at timestamp on project_budgets
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_budgets_updated_at
BEFORE UPDATE ON project_budgets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_invoices_updated_at
BEFORE UPDATE ON project_invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_costs_updated_at
BEFORE UPDATE ON project_costs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budget_history ENABLE ROW LEVEL SECURITY;

-- project_budgets policies
CREATE POLICY "Users can view budgets for projects they have access to"
  ON project_budgets FOR SELECT
  USING (project_id IN (SELECT project_id FROM user_project_ids()));

CREATE POLICY "Managers can create budgets"
  ON project_budgets FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager')
      AND deleted_at IS NULL
    )
  );

CREATE POLICY "Managers can update budgets"
  ON project_budgets FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager')
      AND deleted_at IS NULL
    )
  );

CREATE POLICY "Managers can delete budgets"
  ON project_budgets FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager')
      AND deleted_at IS NULL
    )
  );

-- project_invoices policies
CREATE POLICY "Users can view invoices for their projects"
  ON project_invoices FOR SELECT
  USING (project_id IN (SELECT project_id FROM user_project_ids()));

CREATE POLICY "Managers can upload invoices"
  ON project_invoices FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
    )
  );

CREATE POLICY "Managers can update invoices"
  ON project_invoices FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
    )
  );

CREATE POLICY "Managers can delete invoices"
  ON project_invoices FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager')
      AND deleted_at IS NULL
    )
  );

-- project_costs policies
CREATE POLICY "Users can view costs for their projects"
  ON project_costs FOR SELECT
  USING (project_id IN (SELECT project_id FROM user_project_ids()));

CREATE POLICY "Managers can add costs"
  ON project_costs FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
    )
  );

CREATE POLICY "Managers can update costs"
  ON project_costs FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
    )
  );

CREATE POLICY "Managers can delete costs"
  ON project_costs FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager')
      AND deleted_at IS NULL
    )
  );

-- project_budget_history policies
CREATE POLICY "Users can view budget history for their projects"
  ON project_budget_history FOR SELECT
  USING (
    project_budget_id IN (
      SELECT pb.id FROM project_budgets pb
      WHERE pb.project_id IN (SELECT project_id FROM user_project_ids())
    )
  );

-- No INSERT/UPDATE/DELETE policies for history - managed by triggers/application only

-- =============================================================================
-- STORAGE BUCKET & POLICIES
-- =============================================================================

-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name)
VALUES ('project-invoices', 'project-invoices')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Note: Storage policies must be created via Supabase Dashboard due to API permissions
-- Go to: Storage > project-invoices > Policies
--
-- Policy 1: "Users can upload invoices to their projects"
--   Operation: INSERT
--   Policy:
--     bucket_id = 'project-invoices'
--     AND (storage.foldername(name))[1] IN (
--       SELECT project_id::text FROM user_project_ids()
--     )
--
-- Policy 2: "Users can view invoices from their projects"
--   Operation: SELECT
--   Policy:
--     bucket_id = 'project-invoices'
--     AND (storage.foldername(name))[1] IN (
--       SELECT project_id::text FROM user_project_ids()
--     )
--
-- Policy 3: "Users can update invoices from their projects"
--   Operation: UPDATE
--   Policy:
--     bucket_id = 'project-invoices'
--     AND (storage.foldername(name))[1] IN (
--       SELECT project_id::text FROM user_project_ids()
--     )
--
-- Policy 4: "Managers can delete invoices from their projects"
--   Operation: DELETE
--   Policy:
--     bucket_id = 'project-invoices'
--     AND (storage.foldername(name))[1] IN (
--       SELECT pa.project_id::text FROM project_access pa
--       WHERE pa.user_id = auth.uid()
--       AND pa.role IN ('manager')
--       AND pa.deleted_at IS NULL
--     )

-- ============================================================================
-- STORAGE STRUCTURE
-- ============================================================================

-- Files will be organized as:
-- project-invoices/
--   {project_id}/
--     {invoice_id}/
--       {filename}
--
-- Example: project-invoices/123e4567-e89b-12d3-a456-426614174000/456e7890-e89b-12d3-a456-426614174001/invoice.pdf

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE project_budgets IS 'Budget allocations by category (labor, materials, equipment, other) for each project';
COMMENT ON TABLE project_invoices IS 'Uploaded invoices with AI-parsed metadata and approval workflow';
COMMENT ON TABLE project_costs IS 'Manual cost entries without invoices';
COMMENT ON TABLE project_budget_history IS 'Immutable audit trail of budget allocation changes';
COMMENT ON MATERIALIZED VIEW project_cost_summary IS 'Pre-aggregated cost data for fast dashboard queries';
COMMENT ON FUNCTION calculate_burn_rate IS 'Calculates project burn rate, forecast, and status (on_track/warning/critical)';
