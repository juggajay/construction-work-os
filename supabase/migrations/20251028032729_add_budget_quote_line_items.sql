-- Migration: Add Budget Quote and Line Items
-- Purpose: Enable quote upload and AI-powered line item search for budget allocations
-- OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai

-- ============================================================================
-- TABLE: project_quotes
-- Stores uploaded quote documents with metadata
-- ============================================================================

CREATE TABLE project_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_category project_budget_category NOT NULL,

  -- File storage
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  page_count INTEGER,

  -- Quote metadata
  vendor_name TEXT,
  quote_number TEXT,
  quote_date DATE,
  total_amount DECIMAL(15, 2) CHECK (total_amount >= 0),

  -- AI parsing metadata
  ai_parsed BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3, 2),
  ai_raw_response JSONB,

  -- Audit
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_ai_confidence CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1))
);

-- Indexes for project_quotes
CREATE INDEX idx_project_quotes_project ON project_quotes(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_quotes_category ON project_quotes(budget_category) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_quotes_vendor ON project_quotes(vendor_name) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: budget_line_items
-- Stores individual line items extracted from quotes or manually entered
-- ============================================================================

CREATE TABLE budget_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_budget_id UUID NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
  project_quote_id UUID REFERENCES project_quotes(id) ON DELETE SET NULL,

  -- Line item data
  line_number INTEGER,
  description TEXT NOT NULL,
  quantity DECIMAL(15, 4),
  unit_of_measure TEXT,
  unit_price DECIMAL(15, 2),
  line_total DECIMAL(15, 2) NOT NULL CHECK (line_total >= 0),

  -- AI metadata (if extracted)
  ai_confidence DECIMAL(3, 2),
  ai_corrections JSONB,

  -- Search optimization
  search_vector tsvector,

  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_line_total CHECK (
    (quantity IS NOT NULL AND unit_price IS NOT NULL AND line_total = quantity * unit_price)
    OR (quantity IS NULL AND unit_price IS NULL)
  ),
  CONSTRAINT valid_ai_confidence CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1))
);

-- Indexes for budget_line_items
CREATE INDEX idx_line_items_budget ON budget_line_items(project_budget_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_line_items_quote ON budget_line_items(project_quote_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_line_items_search ON budget_line_items USING GIN(search_vector);
CREATE INDEX idx_line_items_amount ON budget_line_items(line_total DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGER: Full-text search vector update
-- Automatically updates search_vector when line items are inserted/updated
-- ============================================================================

CREATE OR REPLACE FUNCTION update_line_item_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.unit_of_measure, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_line_items_search_vector
BEFORE INSERT OR UPDATE ON budget_line_items
FOR EACH ROW EXECUTE FUNCTION update_line_item_search_vector();

-- ============================================================================
-- MATERIALIZED VIEW: budget_with_line_items
-- Fast budget breakdown with line item counts and totals
-- ============================================================================

CREATE MATERIALIZED VIEW budget_with_line_items AS
SELECT
  pb.id AS budget_id,
  pb.project_id,
  pb.category,
  pb.allocated_amount,
  COUNT(DISTINCT bli.id) AS line_item_count,
  COALESCE(SUM(bli.line_total), 0) AS line_items_total,
  COUNT(DISTINCT pq.id) AS quote_count,
  pb.allocated_amount - COALESCE(SUM(bli.line_total), 0) AS unallocated_amount
FROM project_budgets pb
LEFT JOIN budget_line_items bli ON pb.id = bli.project_budget_id AND bli.deleted_at IS NULL
LEFT JOIN project_quotes pq ON pb.project_id = pq.project_id AND pb.category = pq.budget_category AND pq.deleted_at IS NULL
WHERE pb.deleted_at IS NULL
GROUP BY pb.id, pb.project_id, pb.category, pb.allocated_amount;

CREATE UNIQUE INDEX idx_budget_line_items_summary ON budget_with_line_items(budget_id);
CREATE INDEX idx_budget_line_items_project ON budget_with_line_items(project_id);

-- ============================================================================
-- TRIGGER: Refresh materialized view on line item changes
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_budget_line_items_view()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY budget_with_line_items;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_budget_view_on_line_item_change
AFTER INSERT OR UPDATE OR DELETE ON budget_line_items
FOR EACH STATEMENT EXECUTE FUNCTION refresh_budget_line_items_view();

-- ============================================================================
-- RLS POLICIES: project_quotes
-- ============================================================================

ALTER TABLE project_quotes ENABLE ROW LEVEL SECURITY;

-- Users can view quotes from projects they have access to
CREATE POLICY "Users can view quotes from accessible projects"
ON project_quotes FOR SELECT
USING (
  project_id IN (
    SELECT project_id FROM accessible_project_ids()
  )
  AND deleted_at IS NULL
);

-- Managers and supervisors can upload quotes to their projects
CREATE POLICY "Managers and supervisors can upload quotes"
ON project_quotes FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT pa.project_id FROM project_access pa
    WHERE pa.user_id = auth.uid()
    AND pa.role IN ('manager', 'supervisor')
    AND pa.deleted_at IS NULL
  )
);

-- Managers and supervisors can update quote metadata
CREATE POLICY "Managers and supervisors can update quotes"
ON project_quotes FOR UPDATE
USING (
  project_id IN (
    SELECT pa.project_id FROM project_access pa
    WHERE pa.user_id = auth.uid()
    AND pa.role IN ('manager', 'supervisor')
    AND pa.deleted_at IS NULL
  )
);

-- Only managers can soft-delete quotes
CREATE POLICY "Managers can delete quotes"
ON project_quotes FOR DELETE
USING (
  project_id IN (
    SELECT pa.project_id FROM project_access pa
    WHERE pa.user_id = auth.uid()
    AND pa.role = 'manager'
    AND pa.deleted_at IS NULL
  )
);

-- ============================================================================
-- RLS POLICIES: budget_line_items
-- ============================================================================

ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;

-- Users can view line items from projects they have access to
CREATE POLICY "Users can view line items from accessible projects"
ON budget_line_items FOR SELECT
USING (
  project_budget_id IN (
    SELECT pb.id FROM project_budgets pb
    WHERE pb.project_id IN (
      SELECT project_id FROM accessible_project_ids()
    )
    AND pb.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

-- Managers and supervisors can add line items to their projects
CREATE POLICY "Managers and supervisors can add line items"
ON budget_line_items FOR INSERT
WITH CHECK (
  project_budget_id IN (
    SELECT pb.id FROM project_budgets pb
    JOIN project_access pa ON pb.project_id = pa.project_id
    WHERE pa.user_id = auth.uid()
    AND pa.role IN ('manager', 'supervisor')
    AND pa.deleted_at IS NULL
    AND pb.deleted_at IS NULL
  )
);

-- Managers and supervisors can update line items
CREATE POLICY "Managers and supervisors can update line items"
ON budget_line_items FOR UPDATE
USING (
  project_budget_id IN (
    SELECT pb.id FROM project_budgets pb
    JOIN project_access pa ON pb.project_id = pa.project_id
    WHERE pa.user_id = auth.uid()
    AND pa.role IN ('manager', 'supervisor')
    AND pa.deleted_at IS NULL
    AND pb.deleted_at IS NULL
  )
);

-- Managers and supervisors can delete line items
CREATE POLICY "Managers and supervisors can delete line items"
ON budget_line_items FOR DELETE
USING (
  project_budget_id IN (
    SELECT pb.id FROM project_budgets pb
    JOIN project_access pa ON pb.project_id = pa.project_id
    WHERE pa.user_id = auth.uid()
    AND pa.role IN ('manager', 'supervisor')
    AND pa.deleted_at IS NULL
    AND pb.deleted_at IS NULL
  )
);

-- ============================================================================
-- SEARCH FUNCTION: Full-text search across budget line items
-- ============================================================================

CREATE OR REPLACE FUNCTION search_budget_line_items(
  p_project_id UUID,
  p_search_query TEXT,
  p_category project_budget_category DEFAULT NULL,
  p_min_amount DECIMAL DEFAULT NULL,
  p_max_amount DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  line_item_id UUID,
  budget_category project_budget_category,
  description TEXT,
  quantity DECIMAL(15, 4),
  unit_of_measure TEXT,
  unit_price DECIMAL(15, 2),
  line_total DECIMAL(15, 2),
  quote_file_path TEXT,
  relevance_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bli.id,
    pb.category,
    bli.description,
    bli.quantity,
    bli.unit_of_measure,
    bli.unit_price,
    bli.line_total,
    pq.file_path,
    ts_rank(bli.search_vector, plainto_tsquery('english', p_search_query)) AS relevance_rank
  FROM budget_line_items bli
  JOIN project_budgets pb ON bli.project_budget_id = pb.id
  LEFT JOIN project_quotes pq ON bli.project_quote_id = pq.id
  WHERE pb.project_id = p_project_id
    AND bli.deleted_at IS NULL
    AND bli.search_vector @@ plainto_tsquery('english', p_search_query)
    AND (p_category IS NULL OR pb.category = p_category)
    AND (p_min_amount IS NULL OR bli.line_total >= p_min_amount)
    AND (p_max_amount IS NULL OR bli.line_total <= p_max_amount)
  ORDER BY relevance_rank DESC, bli.line_total DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE project_quotes IS 'Stores uploaded quote documents with AI parsing metadata';
COMMENT ON TABLE budget_line_items IS 'Individual line items from quotes or manual entries with full-text search';
COMMENT ON MATERIALIZED VIEW budget_with_line_items IS 'Aggregated budget data with line item counts and totals';
COMMENT ON FUNCTION search_budget_line_items IS 'Full-text search across line items with relevance ranking';
