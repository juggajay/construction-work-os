-- RFI Module: Row Level Security Policies
-- This migration enables RLS and creates policies for rfis, rfi_responses, and rfi_attachments

-- ============================================================================
-- ENABLE RLS ON ALL RFI TABLES
-- ============================================================================

ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: rfis
-- ============================================================================

-- SELECT: Users can view RFIs in projects they have access to
CREATE POLICY "Users can view RFIs in accessible projects"
  ON rfis FOR SELECT
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND deleted_at IS NULL
  );

-- INSERT: Project managers can create RFIs
CREATE POLICY "Project managers can create RFIs"
  ON rfis FOR INSERT
  WITH CHECK (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND is_project_manager(auth.uid(), project_id)
  );

-- UPDATE: Creators and assignees can update RFIs
-- Additional logic: Only draft RFIs can have content edited (enforced in app layer)
CREATE POLICY "Creators and assignees can update RFIs"
  ON rfis FOR UPDATE
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND (
      created_by = auth.uid() OR
      assigned_to_id = auth.uid() OR
      is_project_manager(auth.uid(), project_id)
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND (
      created_by = auth.uid() OR
      assigned_to_id = auth.uid() OR
      is_project_manager(auth.uid(), project_id)
    )
  );

-- DELETE: Project admins can soft-delete RFIs (via org admin status)
CREATE POLICY "Admins can delete RFIs"
  ON rfis FOR DELETE
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = rfis.project_id
        AND is_org_admin(auth.uid(), p.org_id)
    )
  );

-- ============================================================================
-- RLS POLICIES: rfi_responses
-- ============================================================================

-- SELECT: Users can view responses for RFIs they can access
CREATE POLICY "Users can view responses in accessible RFIs"
  ON rfi_responses FOR SELECT
  USING (
    rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  );

-- INSERT: Users can add responses to accessible RFIs
CREATE POLICY "Users can add responses to accessible RFIs"
  ON rfi_responses FOR INSERT
  WITH CHECK (
    rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  );

-- UPDATE: Response authors can edit their own responses (within time limit - enforced in app)
CREATE POLICY "Authors can update own responses"
  ON rfi_responses FOR UPDATE
  USING (
    author_id = auth.uid()
    AND rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    author_id = auth.uid()
  );

-- DELETE: No DELETE policy - responses are immutable once created
-- (Soft deletes can be added later if needed)

-- ============================================================================
-- RLS POLICIES: rfi_attachments
-- ============================================================================

-- SELECT: Users can view attachments for accessible RFIs
CREATE POLICY "Users can view attachments in accessible RFIs"
  ON rfi_attachments FOR SELECT
  USING (
    rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  );

-- INSERT: Users can upload attachments to accessible RFIs
CREATE POLICY "Users can upload attachments to accessible RFIs"
  ON rfi_attachments FOR INSERT
  WITH CHECK (
    rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  );

-- DELETE: Uploaders can delete their own attachments from draft RFIs
-- (Draft status check enforced in application layer)
CREATE POLICY "Uploaders can delete own attachments"
  ON rfi_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND rfi_id IN (
      SELECT id FROM rfis
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
        AND deleted_at IS NULL
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view RFIs in accessible projects" ON rfis
  IS 'Users can view RFIs in projects they have access to via organization membership or direct project access';

COMMENT ON POLICY "Project managers can create RFIs" ON rfis
  IS 'Only project managers can create new RFIs in their projects';

COMMENT ON POLICY "Creators and assignees can update RFIs" ON rfis
  IS 'RFI creators, assignees, and project managers can update RFIs. Draft-only editing enforced in app layer.';

COMMENT ON POLICY "Users can view responses in accessible RFIs" ON rfi_responses
  IS 'Users can view responses in RFIs they have access to';

COMMENT ON POLICY "Users can add responses to accessible RFIs" ON rfi_responses
  IS 'Any user with RFI access can add responses (for collaborative clarification)';

COMMENT ON POLICY "Users can view attachments in accessible RFIs" ON rfi_attachments
  IS 'Users can view and download attachments from RFIs they can access';
