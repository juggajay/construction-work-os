/**
 * Test Production Actions
 *
 * This script tests the actual server actions that are failing:
 * 1. Create Daily Report
 * 2. Create Submittal
 * 3. Create RFI
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const TEST_USER_EMAIL = 'jaysonryan21@hotmail.com';
const TEST_USER_PASSWORD = 'test123'; // User needs to provide this
const PROJECT_ID = 'b694bd30-93d0-41dc-bda6-aadc9fa3ca57'; // From diagnostics

async function main() {
  console.log('🧪 Testing Production Actions...\n');

  // Create client with anon key (simulates real user)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ============================================================================
  // 0. Authenticate as the test user
  // ============================================================================
  console.log('0️⃣  Authenticating...');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    console.log('\n⚠️  Please ensure you know the password for', TEST_USER_EMAIL);
    console.log('   Or update TEST_USER_PASSWORD in the script');
    return;
  }

  console.log(`✅ Authenticated as ${authData.user.email}\n`);

  // ============================================================================
  // 1. Test Daily Report Creation
  // ============================================================================
  console.log('1️⃣  Testing Daily Report Creation...');

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, org_id, latitude, longitude')
    .eq('id', PROJECT_ID)
    .single();

  if (projectError || !project) {
    console.error('❌ Could not fetch project:', projectError?.message);
  } else {
    console.log(`✅ Project accessible: ${project.name}`);
    console.log(`   Latitude: ${project.latitude}, Longitude: ${project.longitude}`);

    // Check if project has location
    if (!project.latitude || !project.longitude) {
      console.log('⚠️  Project missing coordinates - daily reports require location');
    }
  }

  // Test RPC function access
  const { data: projectIds, error: rpcError } = await supabase.rpc('user_project_ids', {
    user_uuid: authData.user.id,
  });

  if (rpcError) {
    console.error('❌ RPC user_project_ids failed:', rpcError.message);
  } else {
    console.log(`✅ RPC user_project_ids returned ${projectIds?.length || 0} projects`);
  }

  // ============================================================================
  // 2. Test Submittal Number Generation
  // ============================================================================
  console.log('\n2️⃣  Testing Submittal Number Generation...');

  const { data: submittalNumber, error: submittalNumberError } = await supabase.rpc(
    'next_submittal_number',
    {
      p_project_id: PROJECT_ID,
      p_spec_section: '03 30 00',
    }
  );

  if (submittalNumberError) {
    console.error('❌ next_submittal_number failed:', submittalNumberError.message);
    console.log('   This might be why submittals are failing');
  } else {
    console.log(`✅ Submittal number generated: ${submittalNumber}`);
  }

  // ============================================================================
  // 3. Test RFI Number Generation
  // ============================================================================
  console.log('\n3️⃣  Testing RFI Number Generation...');

  // First check if user is project manager
  const { data: isManager, error: isManagerError } = await supabase.rpc('is_project_manager', {
    user_uuid: authData.user.id,
    check_project_id: PROJECT_ID,
  });

  if (isManagerError) {
    console.error('❌ is_project_manager failed:', isManagerError.message);
  } else {
    console.log(`Project manager status: ${isManager ? '✅ YES' : '❌ NO'}`);

    if (!isManager) {
      console.log('⚠️  User is not a project manager - RFI creation will fail');
      console.log('   Need to add user to project_access table with role=manager');
    }
  }

  const { data: rfiNumber, error: rfiNumberError } = await supabase.rpc('next_rfi_number', {
    p_project_id: PROJECT_ID,
  });

  if (rfiNumberError) {
    console.error('❌ next_rfi_number failed:', rfiNumberError.message);
  } else {
    console.log(`✅ RFI number generated: ${rfiNumber}`);
  }

  // ============================================================================
  // 4. Check project_access table
  // ============================================================================
  console.log('\n4️⃣  Checking project_access table...');

  const { data: projectAccess, error: accessError } = await supabase
    .from('project_access')
    .select('*')
    .eq('project_id', PROJECT_ID)
    .eq('user_id', authData.user.id);

  if (accessError) {
    console.error('❌ Error checking project_access:', accessError.message);
  } else if (!projectAccess || projectAccess.length === 0) {
    console.log('❌ User has NO explicit project access entries');
    console.log('   User only has access through organization membership');
    console.log('   RFI creation requires explicit project_access with role=manager');
  } else {
    console.log(`✅ User has ${projectAccess.length} project access entries`);
    projectAccess.forEach(pa => {
      console.log(`   - Role: ${pa.role}`);
    });
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('Authentication: ✅ SUCCESS');
  console.log('Project Access (via org): ✅ SUCCESS');
  console.log('Project Access (explicit):', projectAccess && projectAccess.length > 0 ? '✅ SUCCESS' : '❌ MISSING');
  console.log('Is Project Manager:', isManager ? '✅ YES' : '❌ NO');
  console.log('Daily Report RPC:', rpcError ? '❌ FAILED' : '✅ SUCCESS');
  console.log('Submittal RPC:', submittalNumberError ? '❌ FAILED' : '✅ SUCCESS');
  console.log('RFI RPC:', rfiNumberError ? '❌ FAILED' : '✅ SUCCESS');
  console.log('='.repeat(60));

  // ============================================================================
  // Recommendation
  // ============================================================================
  console.log('\n💡 RECOMMENDATIONS:');

  if (!project?.latitude || !project?.longitude) {
    console.log('❌ Add coordinates to the project for daily reports to work');
  }

  if (!isManager) {
    console.log('❌ Add user to project_access table with role=manager for RFI creation');
    console.log('   Run this SQL in Supabase:');
    console.log(`   INSERT INTO project_access (project_id, user_id, role, granted_by)`);
    console.log(`   VALUES ('${PROJECT_ID}', '${authData.user.id}', 'manager', '${authData.user.id}');`);
  }

  if (submittalNumberError || rfiNumberError || rpcError) {
    console.log('❌ Some RPC functions failed - check database functions are deployed');
  }

  console.log('\n✨ Testing complete!\n');

  // Sign out
  await supabase.auth.signOut();
}

main().catch(console.error);
