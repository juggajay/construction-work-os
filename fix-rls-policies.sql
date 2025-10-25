-- Fix RLS policies for change orders
-- Issue: accessible_project_ids() needs to be called with SELECT * FROM

-- Drop all existing change order RLS policies
DROP POLICY IF EXISTS "Users can view line items for accessible change orders" ON change_order_line_items;
DROP POLICY IF EXISTS "Users can create line items for editable change orders" ON change_order_line_items;
DROP POLICY IF EXISTS "Users can update line items for editable change orders" ON change_order_line_items;
DROP POLICY IF EXISTS "Users can delete line items for editable change orders" ON change_order_line_items;
DROP POLICY IF EXISTS "Users can view approvals for accessible change orders" ON change_order_approvals;
DROP POLICY IF EXISTS "Approvers can update their approval decisions" ON change_order_approvals;
DROP POLICY IF EXISTS "Users can view versions for accessible change orders" ON change_order_versions;
DROP POLICY IF EXISTS "Users can create versions for editable change orders" ON change_order_versions;
DROP POLICY IF EXISTS "Users can view attachments for accessible change orders" ON change_order_attachments;
DROP POLICY IF EXISTS "Users can upload attachments for accessible change orders" ON change_order_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON change_order_attachments;

-- Recreate policies with correct syntax

-- LINE ITEMS
CREATE POLICY "Users can view line items for accessible change orders"
  ON change_order_line_items FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
    )
  );

CREATE POLICY "Users can create line items for editable change orders"
  ON change_order_line_items FOR INSERT
  WITH CHECK (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
        AND status NOT IN ('approved', 'invoiced')
    )
  );

CREATE POLICY "Users can update line items for editable change orders"
  ON change_order_line_items FOR UPDATE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
        AND status NOT IN ('approved', 'invoiced')
    )
  );

CREATE POLICY "Users can delete line items for editable change orders"
  ON change_order_line_items FOR DELETE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
        AND status NOT IN ('approved', 'invoiced')
    )
  );

-- APPROVALS
CREATE POLICY "Users can view approvals for accessible change orders"
  ON change_order_approvals FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
    )
  );

CREATE POLICY "Approvers can update their approval decisions"
  ON change_order_approvals FOR UPDATE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
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
    AND status = 'pending'
  );

-- VERSIONS
CREATE POLICY "Users can view versions for accessible change orders"
  ON change_order_versions FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
    )
  );

CREATE POLICY "Users can create versions for editable change orders"
  ON change_order_versions FOR INSERT
  WITH CHECK (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
    )
    AND created_by = auth.uid()
  );

-- ATTACHMENTS
CREATE POLICY "Users can view attachments for accessible change orders"
  ON change_order_attachments FOR SELECT
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
    )
  );

CREATE POLICY "Users can upload attachments for accessible change orders"
  ON change_order_attachments FOR INSERT
  WITH CHECK (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can delete their own attachments"
  ON change_order_attachments FOR DELETE
  USING (
    change_order_id IN (
      SELECT id FROM change_orders
      WHERE project_id IN (SELECT * FROM accessible_project_ids())
    )
    AND uploaded_by = auth.uid()
  );
