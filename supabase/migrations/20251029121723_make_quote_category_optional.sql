-- Migration: Make Quote Category Optional for Project-Level Quotes
-- Purpose: Allow quotes to be uploaded at project level (not tied to specific budget category)
-- This enables: Single project quote upload with searchable line items

-- ============================================================================
-- STEP 1: Make budget_category nullable in project_quotes
-- ============================================================================

ALTER TABLE project_quotes
  ALTER COLUMN budget_category DROP NOT NULL;

COMMENT ON COLUMN project_quotes.budget_category IS
  'Budget category (labor, materials, equipment, other). NULL for project-level quotes.';

-- ============================================================================
-- STEP 2: Update materialized view to handle project-level quotes
-- ============================================================================

-- Drop and recreate the materialized view with updated logic
DROP MATERIALIZED VIEW IF EXISTS budget_with_line_items;

CREATE MATERIALIZED VIEW budget_with_line_items AS
SELECT
  pb.id AS budget_id,
  pb.project_id,
  pb.category,
  pb.allocated_amount,

  -- Count all line items for this budget (from both category-specific and project-level quotes)
  COUNT(DISTINCT bli.id) AS line_item_count,

  -- Sum line items total (from both category-specific and project-level quotes)
  COALESCE(SUM(bli.line_total), 0) AS line_items_total,

  -- Track if any quotes exist (category-specific or project-level)
  COUNT(DISTINCT pq.id) AS quote_count,

  pb.created_at,
  pb.updated_at
FROM project_budgets pb
-- Join line items through budget (line items are always tied to specific budgets)
LEFT JOIN budget_line_items bli ON
  bli.project_budget_id = pb.id AND
  bli.deleted_at IS NULL
-- Join quotes (can be category-specific OR project-level)
LEFT JOIN project_quotes pq ON
  pq.project_id = pb.project_id AND
  (pq.budget_category = pb.category OR pq.budget_category IS NULL) AND  -- ✅ Include project-level quotes
  pq.deleted_at IS NULL
WHERE pb.deleted_at IS NULL
GROUP BY pb.id, pb.project_id, pb.category, pb.allocated_amount, pb.created_at, pb.updated_at;

-- Recreate indexes
CREATE UNIQUE INDEX idx_budget_with_line_items_id ON budget_with_line_items(budget_id);
CREATE INDEX idx_budget_with_line_items_project ON budget_with_line_items(project_id);
CREATE INDEX idx_budget_with_line_items_category ON budget_with_line_items(category);

-- Add comment
COMMENT ON MATERIALIZED VIEW budget_with_line_items IS
  'Aggregates budget allocations with line item counts and totals. Includes both category-specific and project-level quotes.';

-- ============================================================================
-- NOTES
-- ============================================================================

-- Backward Compatibility:
-- - Existing quotes with budget_category set will continue to work
-- - New project-level quotes will have budget_category = NULL
-- - Search already supports both models (category filter is optional)
-- - Line items remain tied to specific budgets via project_budget_id

-- Usage:
-- - Upload project-level quote: budget_category = NULL
-- - Search line items: works across all quotes (project-level and category-specific)
-- - Budget allocations: manually set, independent of quote uploads
