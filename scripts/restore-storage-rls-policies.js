/**
 * Restore Storage RLS Policies
 *
 * This script re-applies storage RLS policies that were dropped when Supabase support
 * updated the storage.foldername() function with CASCADE.
 *
 * Background: https://github.com/user/repo/issues/SUPABASE_SUPPORT_FOLLOWUP
 *
 * Policies to restore:
 * - project-invoices bucket (3 policies)
 * - project-quotes bucket (4 policies)
 * - daily-report-photos bucket (3 policies)
 */

require('dotenv').config({ path: '.env.local' });
const { readFileSync } = require('fs');

const accessToken = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2';
const projectRef = 'tokjmeqjvexnmtampyjm';

if (!accessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not found');
  process.exit(1);
}

console.log('🔗 Restoring Storage RLS Policies via Management API');
console.log('   Project:', projectRef);
console.log('   Target: Remote production database\n');

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
  console.log(`\n📄 Applying: ${migrationName}...`);

  try {
    const sql = readFileSync(filePath, 'utf8');

    const result = await executeSqlViaApi(sql);

    if (result.success) {
      console.log(`✅ ${migrationName} completed successfully`);
      if (result.data && result.data.length < 500) {
        console.log('   Response:', result.data);
      }
      return true;
    } else {
      console.error(`❌ ${migrationName} failed:`);
      console.error('   Status:', result.status);
      console.error('   Error:', result.error.substring(0, 500));
      return false;
    }
  } catch (err) {
    console.error(`❌ Error applying ${migrationName}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting storage RLS policy restoration...\n');

  const migrations = [
    {
      file: 'supabase/migrations/20250122000021_create_storage_bucket_daily_reports.sql',
      name: 'Daily Report Photos Storage RLS'
    },
    {
      file: 'supabase/migrations/20251028032730_create_project_quotes_storage_bucket.sql',
      name: 'Project Quotes Storage RLS'
    },
    {
      file: 'supabase/migrations/20251030000003_fix_storage_invoices_rls.sql',
      name: 'Project Invoices Storage RLS'
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
    // Wait 2 seconds between migrations to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESTORATION RESULTS');
  console.log('='.repeat(60));
  console.log(`   ✅ Successful: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('');

  if (success > 0) {
    console.log('✅ Storage RLS policies have been restored!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Verify policies in Supabase Dashboard > Storage > Policies');
    console.log('   2. Test invoice upload functionality in browser');
    console.log('   3. Check storage dashboard accessibility');
    console.log('');
  } else {
    console.log('⚠️  No policies were restored successfully.');
    console.log('   Check error messages above for details.');
    console.log('');
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
