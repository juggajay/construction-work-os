/**
 * Verify Storage RLS Policies
 *
 * Queries the remote database to verify that storage RLS policies exist
 * and are properly configured.
 */

require('dotenv').config({ path: '.env.local' });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2';
const projectRef = 'tokjmeqjvexnmtampyjm';

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

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: JSON.stringify(data), status: response.status };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🔍 Verifying Storage RLS Policies\n');
  console.log('   Project:', projectRef);
  console.log('   Target: Remote production database\n');

  // Query 1: List all storage buckets
  console.log('📦 Checking Storage Buckets...\n');
  const bucketsQuery = `
    SELECT id, name, public, file_size_limit, allowed_mime_types
    FROM storage.buckets
    WHERE id IN ('project-invoices', 'project-quotes', 'daily-report-photos')
    ORDER BY id;
  `;

  const bucketsResult = await executeSqlViaApi(bucketsQuery);
  if (bucketsResult.success) {
    console.log('✅ Storage Buckets Found:');
    console.table(bucketsResult.data);
  } else {
    console.error('❌ Failed to query buckets:', bucketsResult.error);
  }

  // Query 2: List all storage.objects policies
  console.log('\n🔐 Checking Storage RLS Policies...\n');
  const policiesQuery = `
    SELECT
      schemaname,
      tablename,
      policyname,
      cmd AS command,
      CASE
        WHEN cmd = 'INSERT' THEN 'INSERT'
        WHEN cmd = 'SELECT' THEN 'SELECT'
        WHEN cmd = 'UPDATE' THEN 'UPDATE'
        WHEN cmd = 'DELETE' THEN 'DELETE'
        ELSE cmd
      END AS operation
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname LIKE '%invoice%'
        OR policyname LIKE '%quote%'
        OR policyname LIKE '%daily report%'
      )
    ORDER BY tablename, policyname;
  `;

  const policiesResult = await executeSqlViaApi(policiesQuery);
  if (policiesResult.success) {
    const policies = policiesResult.data;
    console.log(`✅ Found ${policies.length} Storage RLS Policies:\n`);

    // Group by bucket
    const invoicePolicies = policies.filter(p => p.policyname.includes('invoice'));
    const quotePolicies = policies.filter(p => p.policyname.includes('quote'));
    const dailyReportPolicies = policies.filter(p => p.policyname.includes('daily report'));

    if (invoicePolicies.length > 0) {
      console.log('📄 Project Invoices:');
      invoicePolicies.forEach(p => console.log(`   - ${p.policyname} (${p.operation})`));
      console.log('');
    }

    if (quotePolicies.length > 0) {
      console.log('📊 Project Quotes:');
      quotePolicies.forEach(p => console.log(`   - ${p.policyname} (${p.operation})`));
      console.log('');
    }

    if (dailyReportPolicies.length > 0) {
      console.log('📸 Daily Report Photos:');
      dailyReportPolicies.forEach(p => console.log(`   - ${p.policyname} (${p.operation})`));
      console.log('');
    }

    // Summary
    console.log('=' .repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Project Invoices:    ${invoicePolicies.length} policies (expected: 3)`);
    console.log(`   Project Quotes:      ${quotePolicies.length} policies (expected: 4)`);
    console.log(`   Daily Report Photos: ${dailyReportPolicies.length} policies (expected: 3)`);
    console.log(`   TOTAL:               ${policies.length} policies (expected: 10)`);
    console.log('');

    if (policies.length >= 10) {
      console.log('✅ All storage RLS policies are in place!');
      console.log('');
      console.log('📋 Next Steps:');
      console.log('   1. Test invoice upload in browser');
      console.log('   2. Check Supabase Storage Dashboard accessibility');
      console.log('');
    } else {
      console.log('⚠️  Some policies may be missing. Review the list above.');
      console.log('');
    }
  } else {
    console.error('❌ Failed to query policies:', policiesResult.error);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
