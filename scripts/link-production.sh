#!/bin/bash
# Link to production Supabase project

set -e

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep SUPABASE_ACCESS_TOKEN | xargs)
fi

# Project details
PROJECT_REF="tokjmeqjvexnmtampyjm"
DB_PASSWORD="Jay210784"

echo "🔗 Linking to production Supabase project: $PROJECT_REF"
echo ""

# Try to link
supabase link --project-ref "$PROJECT_REF" --password "$DB_PASSWORD"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully linked to production!"
    echo ""
    echo "You can now:"
    echo "  - Push migrations: npm run db:push"
    echo "  - Pull schema: npm run db:pull"
    echo "  - Generate types: supabase gen types typescript --project-id $PROJECT_REF > lib/types/supabase.ts"
else
    echo ""
    echo "❌ Link failed. This might be because:"
    echo "  1. Connection pooling is not enabled on your Supabase project"
    echo "  2. The database is still initializing"
    echo ""
    echo "To enable connection pooling:"
    echo "  1. Go to: https://app.supabase.com/project/$PROJECT_REF/settings/database"
    echo "  2. Scroll to 'Connection Pooling'"
    echo "  3. Enable 'Connection pooler'"
    echo "  4. Wait a few minutes for it to activate"
    echo "  5. Run this script again"
    echo ""
    echo "OR manually add to .git/config.toml:"
    echo "  project_id = \"$PROJECT_REF\""
fi
