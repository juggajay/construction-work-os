#!/bin/bash
set -e

API_URL="https://api.supabase.com/v1/projects/tokjmeqjvexnmtampyjm/database/query"
ACCESS_TOKEN="sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2"

MIGRATIONS=(
  "supabase/migrations/20250125000000_create_change_order_enums.sql"
  "supabase/migrations/20250125000001_create_change_orders_table.sql"
  "supabase/migrations/20250125000002_create_change_order_line_items_table.sql"
  "supabase/migrations/20250125000003_create_change_order_approvals_table.sql"
  "supabase/migrations/20250125000004_create_change_order_versions_table.sql"
  "supabase/migrations/20250125000005_create_change_order_attachments_table.sql"
  "supabase/migrations/20250125000006_create_co_numbering_functions.sql"
  "supabase/migrations/20250125000007_create_change_order_rls_policies.sql"
  "supabase/migrations/20250125000008_create_change_order_audit_triggers.sql"
  "supabase/migrations/20250125000009_add_cumulative_contract_value_to_projects.sql"
  "supabase/migrations/20250125000010_create_storage_bucket_change_orders.sql"
)

echo "🚀 Starting migration deployment..."
echo ""

for migration in "${MIGRATIONS[@]}"; do
  echo "📄 Applying: $migration"

  # Read SQL file and escape for JSON
  SQL=$(cat "$migration" | jq -Rs .)

  # Execute via Management API
  RESPONSE=$(curl --ssl-no-revoke -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $SQL}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Failed with HTTP $HTTP_CODE"
    echo "Response: $BODY"
    exit 1
  fi

  echo "✅ Success"
  echo ""
done

echo "🎉 All 11 migrations applied successfully!"
