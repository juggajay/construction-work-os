#!/bin/bash
# Generate TypeScript types from Supabase schema

set -e

echo "🔄 Generating TypeScript types from Supabase schema..."

# Check if Supabase is running
if ! supabase status > /dev/null 2>&1; then
  echo "❌ Supabase is not running. Starting Supabase..."
  supabase start
fi

# Generate types
supabase gen types typescript --local > lib/types/supabase.ts

echo "✅ Types generated successfully at lib/types/supabase.ts"

# Show summary
echo ""
echo "📊 Type generation summary:"
wc -l lib/types/supabase.ts
