-- Ensure the project-invoices storage bucket exists
-- This creates the bucket with only basic columns that exist in all Supabase versions

INSERT INTO storage.buckets (id, name)
VALUES ('project-invoices', 'project-invoices')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;
