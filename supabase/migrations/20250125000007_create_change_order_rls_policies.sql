-- Migration: Create RLS Policies for Change Orders
-- Created: 2025-01-25
-- Description: Row-Level Security policies for all change order tables

-- ============================================================================
-- HELPER FUNCTION (if not already exists)
-- ============================================================================

-- Function to get all project IDs accessible by a user
CREATE OR REPLACE FUNCTION accessible_project_ids()
RETURNS TABLE(project_id UUID) AS $$
  SELECT DISTINCT p.id
  FROM projects p
  INNER JOIN organization_members om ON om.org_id = p.org_id
  WHERE om.user_id = auth.uid()
    AND om.deleted_at IS NULL
  UNION
  SELECT pa.project_id
  FROM project_access pa
  WHERE pa.user_id = auth.uid()
    AND pa.deleted_at IS NULL
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- CHANGE_ORDERS TABLE RLS
-- ============================================================================

ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view change orders for their projects
CREATE POLICY "Users can view change orders for their projects"
  ON change_orders FOR SELECT
  USING (
    project_id IN (SELECT * FROM accessible_project_ids())
  );

-- Policy: Users can create change orders for their projects
CREATE POLICY "Users can create change orders for their projects"
  ON change_orders FOR INSERT
  WITH CHECK (
    project_id IN (SELECT * FROM accessible_project_ids())
    AND created_by = auth.uid()
  );

-- Policy: Creators and project managers can update change orders
CREATE POLICY "Creators and managers can update change orders"
  ON change_orders FOR UPDATE
  USING (
    project_id IN (SELECT * FROM accessible_project_ids())
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_access pa
        WHERE pa.project_id = change_orders.project_id
          AND pa.user_id = auth.uid()
          AND pa.role IN ('manager', 'supervisor')
          AND pa.deleted_at IS NULL
      )
    )
    -- Cannot edit approved or invoiced change orders
    AND status NOT IN ('approved', 'invoiced')
  );

-- Policy: Creators can soft-delete their own change orders (if not submitted)
CREATE POLICY "Creators can delete their draft change orders"
  ON change_orders FOR DELETE
  USING (
    project_id IN (SELECT * FROM accessible_project_ids())
    AND created_by = auth.uid()
    AND status IN ('contemplated', 'potential')
  );

-- ============================================================================
-- CHANGE_ORDER_LINE_ITEMS TABLE RLS
-- ============================================================================

ALTER TABLE change_order_line_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view line items for change orders they can access
CREATE POLICY "Users can view line items for accessible change orders"
  ON change_order_line_items FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
    )
  );

-- Policy: Users can create line items for change orders they can edit
CREATE POLICY "Users can create line items for editable change orders"
  ON change_order_line_items FOR INSERT
  WITH CHECK (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
        AND status NOT IN ('approved', 'invoiced')
    )
  );

-- Policy: Users can update line items for change orders they can edit
CREATE POLICY "Users can update line items for editable change orders"
  ON change_order_line_items FOR UPDATE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
        AND status NOT IN ('approved', 'invoiced')
    )
  );

-- Policy: Users can delete line items for change orders they can edit
CREATE POLICY "Users can delete line items for editable change orders"
  ON change_order_line_items FOR DELETE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
        AND status NOT IN ('approved', 'invoiced')
    )
  );

-- ============================================================================
-- CHANGE_ORDER_APPROVALS TABLE RLS
-- ============================================================================

ALTER TABLE change_order_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view approvals for accessible change orders
CREATE POLICY "Users can view approvals for accessible change orders"
  ON change_order_approvals FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
    )
  );

-- Policy: System can create approval records (approvals are created by triggers)
CREATE POLICY "System can create approval records"
  ON change_order_approvals FOR INSERT
  WITH CHECK (true);

-- Policy: Assigned approvers can update their approval decisions
CREATE POLICY "Approvers can update their approval decisions"
  ON change_order_approvals FOR UPDATE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
    )
    AND (
      approver_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.org_id = change_order_approvals.approver_org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
          AND om.deleted_at IS NULL
      )
      OR EXISTS (
        SELECT 1 FROM project_access pa
        JOIN change_orders co ON co.project_id = pa.project_id
        WHERE co.id = change_order_approvals.change_order_id
          AND pa.user_id = auth.uid()
          AND pa.role = 'manager'
          AND pa.deleted_at IS NULL
      )
    )
    AND status = 'pending' -- Can only update pending approvals
  );

-- ============================================================================
-- CHANGE_ORDER_VERSIONS TABLE RLS
-- ============================================================================

ALTER TABLE change_order_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions for accessible change orders
CREATE POLICY "Users can view versions for accessible change orders"
  ON change_order_versions FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
    )
  );

-- Policy: Users can create versions for change orders they can edit
CREATE POLICY "Users can create versions for editable change orders"
  ON change_order_versions FOR INSERT
  WITH CHECK (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
    )
    AND created_by = auth.uid()
  );

-- ============================================================================
-- CHANGE_ORDER_ATTACHMENTS TABLE RLS
-- ============================================================================

ALTER TABLE change_order_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments for accessible change orders
CREATE POLICY "Users can view attachments for accessible change orders"
  ON change_order_attachments FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
    )
  );

-- Policy: Users can upload attachments for accessible change orders
CREATE POLICY "Users can upload attachments for accessible change orders"
  ON change_order_attachments FOR INSERT
  WITH CHECK (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
    )
    AND uploaded_by = auth.uid()
  );

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
  ON change_order_attachments FOR DELETE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT accessible_project_ids())
    )
    AND uploaded_by = auth.uid()
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view change orders for their projects" ON change_orders IS 'Users can view change orders for projects they have access to';
COMMENT ON POLICY "Creators and managers can update change orders" ON change_orders IS 'Creators and project managers can edit change orders (but not approved/invoiced ones)';
COMMENT ON POLICY "Approvers can update their approval decisions" ON change_order_approvals IS 'Assigned approvers can approve or reject pending approvals';

-- ============================================================================
-- DOWN MIGRATION (Rollback)
-- ============================================================================
-- ALTER TABLE change_order_attachments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE change_order_versions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE change_order_approvals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE change_order_line_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE change_orders DISABLE ROW LEVEL SECURITY;
