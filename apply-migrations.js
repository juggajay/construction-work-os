const fs = require('fs');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.tokjmeqjvexnmtampyjm:fJ1XI7m5uBkvokYS@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

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

async function applyMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    for (const file of migrationFiles) {
      console.log(`📄 Applying: ${file}`);
      const sql = fs.readFileSync(file, 'utf8');
      await client.query(sql);
      console.log(`✅ Applied: ${file}\n`);
    }

    console.log('🎉 All migrations applied successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();
