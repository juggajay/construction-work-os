require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const { readFileSync } = require('fs');

// Use the exact connection string from .env.local
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('🔗 Connecting to database...');
console.log('   Host:', connectionString.split('@')[1]?.split('/')[0]);

async function applyMigration(client, filePath, migrationName) {
  console.log(`\n📄 Applying migration: ${migrationName}...`);

  try {
    const sql = readFileSync(filePath, 'utf8');

    // Execute the entire migration file
    await client.query(sql);

    console.log(`✅ Migration ${migrationName} completed successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Error applying ${migrationName}:`);
    console.error('   ', err.message);
    if (err.position) {
      console.error('   Position:', err.position);
    }
    return false;
  }
}

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    query_timeout: 60000
  });

  try {
    console.log('⏳ Establishing connection...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

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

    let success = 0;
    let failed = 0;

    for (const migration of migrations) {
      const result = await applyMigration(client, migration.file, migration.name);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    console.log('\n📊 Results:');
    console.log(`   ✅ Successful: ${success}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log('\n✅ Migration process complete!\n');

  } catch (err) {
    console.error('\n❌ Connection error:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check if your IP is allowlisted in Supabase Dashboard');
    console.error('  2. Verify DATABASE_URL is correct in .env.local');
    console.error('  3. Try using port 6543 instead of 5432 (pooler vs direct)');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
