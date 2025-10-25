const fs = require('fs');

const SUPABASE_URL = 'https://tokjmeqjvexnmtampyjm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRva2ptZXFqdmV4bm10YW1weWptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk1NDEzNywiZXhwIjoyMDc2NTMwMTM3fQ.ZoHHwBt9j2JLer_ilAS11KHvcjOm8Bo7Faq6eRIR5Uo';

const migrationFiles = [
  'supabase/migrations/20250125000000_create_change_order_enums.sql',
  'supabase/migrations/20250125000001_create_change_orders_table.sql',
  'supabase/migrations/20250125000002_create_change_order_line_items_table.sql',
  'supabase/migrations/20250125000003_create_change_order_approvals_table.sql',
  'supabase/migrations/20250125000004_create_change_order_versions_table.sql',
  'supabase/migrations/20250125000005_create_change_order_attachments_table.sql',
  'supabase/migrations/20250125000006_create_co_numbering_functions.sql',
  'supabase/migrations/20250125000007_create_change_order_rls_policies.sql',
  'supabase/migrations/20250125000008_create_change_order_audit_triggers.sql',
  'supabase/migrations/20250125000009_add_cumulative_contract_value_to_projects.sql',
  'supabase/migrations/20250125000010_create_storage_bucket_change_orders.sql',
];

async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function applyMigrations() {
  try {
    console.log('📦 Reading migration files...\n');

    const combinedSql = fs.readFileSync('combined_change_orders_migration.sql', 'utf8');

    console.log('🚀 Executing combined migration...');
    console.log(`   Size: ${(combinedSql.length / 1024).toFixed(2)} KB`);
    console.log(`   Lines: ${combinedSql.split('\n').length}\n`);

    // Try to execute via PostgREST
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: combinedSql
      })
    });

    console.log(`Response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`Response: ${responseText.substring(0, 200)}`);

    if (!response.ok) {
      throw new Error(`Failed to execute migrations: ${responseText}`);
    }

    console.log('\n🎉 Migrations applied successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Note: PostgREST API may not support raw SQL execution.');
    console.error('   Please use the Supabase Dashboard SQL Editor instead:');
    console.error(`   1. Go to: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/sql/new`);
    console.error('   2. Copy content from: combined_change_orders_migration.sql');
    console.error('   3. Paste and click "Run"\n');
    process.exit(1);
  }
}

applyMigrations();
