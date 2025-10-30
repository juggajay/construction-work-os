-- Add certifications and enhanced team management fields
-- For Phase 8: Team Management

-- Add certifications array to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS company TEXT;

-- Create index for faster certification queries
CREATE INDEX IF NOT EXISTS idx_profiles_certifications ON profiles USING GIN (certifications);

-- Add comment
COMMENT ON COLUMN profiles.certifications IS 'Array of certification objects with name, issuer, issued_date, expiry_date';
COMMENT ON COLUMN profiles.job_title IS 'Job title or position';
COMMENT ON COLUMN profiles.company IS 'Company or contractor name';
