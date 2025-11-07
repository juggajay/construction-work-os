require('dotenv').config({ path: '.env.local' });
const { readFileSync } = require('fs');

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!accessToken) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable not set');
  console.error('   Please add SUPABASE_ACCESS_TOKEN to your .env.local file');
  console.error('   See SUPABASE_MIGRATION_GUIDE.md for setup instructions');
  process.exit(1);
}

if (!projectRef) {
  console.error('❌ Error: SUPABASE_PROJECT_REF environment variable not set');
  console.error('   Please add SUPABASE_PROJECT_REF to your .env.local file');
  console.error('   See SUPABASE_MIGRATION_GUIDE.md for setup instructions');
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
      file: 'supabase/migrations/20251030000001_fix_project_budgets_rls.sql',
      name: 'fix_project_budgets_rls'
    },
    {
      file: 'supabase/migrations/20251030000002_fix_project_invoices_rls.sql',
      name: 'fix_project_invoices_rls'
    },
    {
      file: 'supabase/migrations/20251030000004_fix_project_costs_rls.sql',
      name: 'fix_project_costs_rls'
    },
    {
      file: 'supabase/migrations/20251030000005_add_storage_bucket_columns.sql',
      name: 'add_storage_bucket_columns'
    },
    {
      file: 'supabase/migrations/20251030000004_ensure_storage_bucket_exists.sql',
      name: 'ensure_storage_bucket_exists'
    },
    {
      file: 'supabase/migrations/20251030000003_fix_storage_invoices_rls.sql',
      name: 'fix_storage_invoices_rls'
    },
    // NEW: Performance optimization migrations
    {
      file: 'supabase/migrations/20251101000000_optimize_project_metrics.sql',
      name: 'optimize_project_metrics'
    },
    {
      file: 'supabase/migrations/20251101000001_add_performance_indexes.sql',
      name: 'add_performance_indexes'
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
