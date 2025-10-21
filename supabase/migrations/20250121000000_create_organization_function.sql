-- Function to create organization with proper RLS context
-- This bypasses the Server Action -> RLS context issue in production

CREATE OR REPLACE FUNCTION create_organization_with_member(
  p_name TEXT,
  p_slug TEXT
)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT
) AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert organization (SECURITY DEFINER bypasses RLS for insert)
  INSERT INTO organizations (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_org_id;

  -- Add creator as owner
  INSERT INTO organization_members (org_id, user_id, role, invited_by, joined_at)
  VALUES (v_org_id, v_user_id, 'owner', v_user_id, NOW());

  -- Return the organization
  RETURN QUERY
  SELECT 
    v_org_id,
    p_name,
    p_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_with_member(TEXT, TEXT) TO authenticated;

-- Comment
COMMENT ON FUNCTION create_organization_with_member IS 
  'Creates an organization and adds the current user as owner. 
   Uses SECURITY DEFINER to bypass RLS issues with Server Actions in production.';
