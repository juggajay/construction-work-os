#!/bin/bash

# Check RLS policies in production Supabase

echo "=== Checking RLS Policies in Production ==="
echo ""

# Run the SQL check
npx supabase db psql << 'SQL'
-- Check if RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'organizations';

-- Check policies
SELECT 
  policyname, 
  cmd as operation,
  substring(with_check::text, 1, 50) as with_check_clause
FROM pg_policies 
WHERE tablename = 'organizations';

-- Check if helper functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('user_org_ids', 'user_project_ids', 'is_org_admin');
SQL

echo ""
echo "=== If policies are missing, run: npm run db:push ==="
