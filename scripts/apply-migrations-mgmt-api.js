require('dotenv').config({ path: '.env.local' });
const { readFileSync } = require('fs');

const accessToken = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2';
const projectRef = 'tokjmeqjvexnmtampyjm';

if (!accessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not found');
  process.exit(1);
}

console.log('🔗 Using Supabase Management API');
console.log('   Project:', projectRef);

async function executeSqlViaApi(sql) {
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    const data = await response.text();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data, status: response.status };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function applyMigration(filePath, migrationName) {
  console.log(`\n📄 Applying migration: ${migrationName}...`);

  try {
    const sql = readFileSync(filePath, 'utf8');

    const result = await executeSqlViaApi(sql);

    if (result.success) {
      console.log(`✅ Migration ${migrationName} completed successfully`);
      if (result.data && result.data.length < 500) {
        console.log('   Response:', result.data);
      }
      return true;
    } else {
      console.error(`❌ Migration ${migrationName} failed:`);
      console.error('   Status:', result.status);
      console.error('   Error:', result.error.substring(0, 300));
      return false;
    }
  } catch (err) {
    console.error(`❌ Error applying ${migrationName}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Starting migration process via Management API...\n');

  const migrations = [
    {
      file: 'supabase/migrations/20251025162555_add_project_cost_tracking.sql',
      name: 'add_project_cost_tracking'
    }
  ];

  let success = 0;
  let failed = 0;

  for (const migration of migrations) {
    const result = await applyMigration(migration.file, migration.name);
    if (result) {
      success++;
    } else {
      failed++;
    }
    // Wait a bit between migrations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Results:');
  console.log(`   ✅ Successful: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (success > 0) {
    console.log('\n✅ Migrations applied! Changes are now live in production.\n');
  } else {
    console.log('\n⚠️  No migrations were applied successfully.\n');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
