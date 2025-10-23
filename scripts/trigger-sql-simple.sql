-- Create the function (Step 1)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, settings)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;
