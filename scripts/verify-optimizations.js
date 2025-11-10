/**
 * Verification Script - Check Performance Optimizations
 * Verifies all 3 migrations are working correctly
 */

const PROJECT_REF = 'tokjmeqjvexnmtampyjm';
const ACCESS_TOKEN = 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

async function query(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ACCESS_TOKEN,
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function verifyIndexes() {
  console.log('\n📊 Verifying Performance Indexes...');

  const sql = `
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND indexname IN (
      'idx_change_order_approvals_co_version',
      'idx_rfi_responses_rfi_created',
      'idx_submittal_attachments_submittal_version',
      'idx_submittal_reviews_submittal',
      'idx_submittal_versions_submittal',
      'idx_change_order_line_items_version',
      'idx_daily_report_attachments_type',
      'idx_rfis_assigned_to',
      'idx_project_invoices_batch'
    )
    ORDER BY tablename, indexname;
  `;

  try {
    const result = await query(sql);
    const indexes = result[0]?.rows || [];

    console.log(`   ✅ Found ${indexes.length}/9 expected indexes`);

    if (indexes.length < 9) {
      console.log('   ⚠️  Some indexes missing!');
      return false;
    }

    return true;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

async function verifyBatchFunction() {
  console.log('\n📊 Verifying Batch Project Health Function...');

  const sql = `
    SELECT routine_name, routine_type
    FROM information_schema.routines
    WHERE routine_name = 'get_batch_project_health'
    AND routine_schema = 'public';
  `;

  try {
    const result = await query(sql);
    const functions = result[0]?.rows || [];

    if (functions.length > 0) {
      console.log('   ✅ Function exists');
      return true;
    } else {
      console.log('   ❌ Function not found');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

async function verifyRefreshFunction() {
  console.log('\n📊 Verifying Materialized View Refresh Function...');

  const sql = `
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_name = 'refresh_all_materialized_views'
    AND routine_schema = 'public';
  `;

  try {
    const result = await query(sql);
    const functions = result[0]?.rows || [];

    if (functions.length > 0) {
      console.log('   ✅ Function exists');
      return true;
    } else {
      console.log('   ❌ Function not found');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 PERFORMANCE OPTIMIZATION VERIFICATION\n');
  console.log('=' .repeat(50));

  const results = {
    indexes: await verifyIndexes(),
    batchFunction: await verifyBatchFunction(),
    refreshFunction: await verifyRefreshFunction(),
  };

  console.log('\n' + '='.repeat(50));
  console.log('\n📋 VERIFICATION SUMMARY:');
  console.log(`   Performance Indexes: ${results.indexes ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Batch Health Function: ${results.batchFunction ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Refresh Function: ${results.refreshFunction ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(r => r);

  console.log('\n' + (allPassed ? '✅ ALL VERIFICATIONS PASSED!' : '❌ SOME VERIFICATIONS FAILED'));
  console.log('='.repeat(50) + '\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
