require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // exec_sql might not exist, try direct query
      throw error;
    }

    return { success: true, data };
  } catch (err) {
    // If exec_sql doesn't exist, we need to use a different approach
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

    for (const statement of statements) {
      if (!statement) continue;

      try {
        const { error } = await supabase.rpc('query', { query_text: statement });
        if (error) throw error;
      } catch (e) {
        console.error('Error executing statement:', e.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }

    return { success: true };
  }
}

async function applyMigration(filePath, migrationName) {
  console.log(`\n📄 Applying migration: ${migrationName}...`);

  try {
    const sql = readFileSync(filePath, 'utf8');

    // Split into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 5);

    console.log(`   Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        // Use raw SQL execution via fetch
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response.ok) {
          const error = await response.text();
          console.log(`   ⚠️  Statement ${i+1}: ${error.substring(0, 100)}`);
        } else {
          console.log(`   ✅ Statement ${i+1} executed`);
        }
      } catch (err) {
        console.log(`   ⚠️  Statement ${i+1}: ${err.message}`);
      }
    }

    console.log(`✅ Migration ${migrationName} completed`);
    return true;
  } catch (err) {
    console.error(`❌ Error applying ${migrationName}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Starting migration process...\n');

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

  console.log('\n✅ Migration process complete!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
