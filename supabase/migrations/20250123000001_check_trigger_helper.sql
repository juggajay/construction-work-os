-- Helper function to check if a trigger exists
-- Used by diagnostic scripts

CREATE OR REPLACE FUNCTION public.check_trigger_exists(trigger_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = trigger_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
