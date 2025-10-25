const { readFileSync } = require('fs');
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.tokjmeqjvexnmtampyjm:fJ1XI7m5uBkvokYS@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function applyMigration(client, filePath, migrationName) {
  console.log(`\nApplying migration: ${migrationName}...`);

  try {
    const sql = readFileSync(filePath, 'utf8');

    await client.query(sql);

    console.log(`✅ Successfully applied ${migrationName}`);
    return true;
  } catch (err) {
    console.error(`❌ Error applying ${migrationName}:`, err.message);
    return false;
  }
}

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

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
      await applyMigration(client, migration.file, migration.name);
    }

    console.log('\n✅ Migration process complete!');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
