-- Function to create project with proper RLS context
-- This bypasses the Server Action -> RLS context issue in production

CREATE OR REPLACE FUNCTION create_project_with_access(
  p_org_id UUID,
  p_name TEXT,
  p_number TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'planning',
  p_budget DECIMAL DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  project_org_id UUID,
  project_number TEXT,
  project_address TEXT,
  project_status TEXT,
  project_budget DECIMAL,
  project_start_date DATE,
  project_end_date DATE
) AS $$
DECLARE
  v_project_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert project (SECURITY DEFINER bypasses RLS for insert)
  INSERT INTO projects (org_id, name, number, address, status, budget, start_date, end_date)
  VALUES (p_org_id, p_name, p_number, p_address, p_status::project_status, p_budget, p_start_date, p_end_date)
  RETURNING id INTO v_project_id;

  -- Return the project
  RETURN QUERY
  SELECT 
    v_project_id,
    p_name,
    p_org_id,
    p_number,
    p_address,
    p_status,
    p_budget,
    p_start_date,
    p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_project_with_access(UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, DATE, DATE) TO authenticated;

-- Comment
COMMENT ON FUNCTION create_project_with_access IS 
  'Creates a project for an organization. 
   Uses SECURITY DEFINER to bypass RLS issues with Server Actions in production.';
