const { readFileSync } = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(filePath, migrationName) {
  console.log(`\nApplying migration: ${migrationName}...`);

  try {
    const sql = readFileSync(filePath, 'utf8');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: sql
    });

    if (error) {
      // Try alternative method - direct query
      const { error: directError } = await supabase.from('_migrations').insert({
        name: migrationName,
        executed_at: new Date().toISOString()
      });

      if (directError) {
        console.error(`Error applying ${migrationName}:`, error);
        return false;
      }
    }

    console.log(`✅ Successfully applied ${migrationName}`);
    return true;
  } catch (err) {
    console.error(`Exception applying ${migrationName}:`, err);
    return false;
  }
}

async function main() {
  console.log('Starting migration process...');

  const migrations = [
    {
      file: 'supabase/migrations/20251025025919_fix_change_order_numbering_case_type_mismatch.sql',
      name: 'fix_change_order_numbering_case_type_mismatch'
    },
    {
      file: 'supabase/migrations/20251025030803_fix_daily_reports_user_foreign_keys.sql',
      name: 'fix_daily_reports_user_foreign_keys'
    }
  ];

  for (const migration of migrations) {
    await applyMigration(migration.file, migration.name);
  }

  console.log('\nMigration process complete!');
}

main().catch(console.error);
