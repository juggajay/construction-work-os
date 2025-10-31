-- Create email_captures table for landing page email collection
CREATE TABLE IF NOT EXISTS public.email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for email lookups (duplicate prevention)
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON public.email_captures(email);

-- Add index for source analytics
CREATE INDEX IF NOT EXISTS idx_email_captures_source ON public.email_captures(source);

-- Add index for time-based queries
CREATE INDEX IF NOT EXISTS idx_email_captures_captured_at ON public.email_captures(captured_at DESC);

-- Add RLS policies
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (from landing page)
CREATE POLICY "Allow public email capture inserts"
  ON public.email_captures
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only allow authenticated users to read (for admin purposes)
CREATE POLICY "Allow authenticated users to read email captures"
  ON public.email_captures
  FOR SELECT
  TO authenticated
  USING (true);

-- Add comment
COMMENT ON TABLE public.email_captures IS 'Stores email addresses captured from landing page forms (exit intent, etc.)';
