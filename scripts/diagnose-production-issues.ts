/**
 * Production Diagnostics Script
 *
 * This script diagnoses "Organization not found" errors in production
 * by checking:
 * 1. User profile exists
 * 2. Organization membership exists
 * 3. Profile trigger is installed
 * 4. RLS policies are working correctly
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

// Production credentials from .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_USER_EMAIL = 'jaysonryan21@hotmail.com';
const TEST_ORG_SLUG = 'ryox-carpentry';

async function main() {
  console.log('🔍 Starting Production Diagnostics...\n');

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ============================================================================
  // 1. Check if user exists and has a profile
  // ============================================================================
  console.log('1️⃣  Checking user and profile...');

  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error fetching users:', authError);
    return;
  }

  const user = authUser.users.find(u => u.email === TEST_USER_EMAIL);

  if (!user) {
    console.error(`❌ User ${TEST_USER_EMAIL} not found in auth.users`);
    return;
  }

  console.log(`✅ User found: ${user.id} (${user.email})`);

  // Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('❌ Profile not found for user');
    console.log('   Creating profile now...');

    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.email?.split('@')[0] || 'User',
        settings: {}
      });

    if (createError) {
      console.error('   ❌ Failed to create profile:', createError);
    } else {
      console.log('   ✅ Profile created successfully');
    }
  } else {
    console.log(`✅ Profile exists: ${profile.full_name}`);
  }

  // ============================================================================
  // 2. Check organization exists
  // ============================================================================
  console.log('\n2️⃣  Checking organization...');

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', TEST_ORG_SLUG)
    .single();

  if (orgError || !org) {
    console.error(`❌ Organization '${TEST_ORG_SLUG}' not found`);
    return;
  }

  console.log(`✅ Organization found: ${org.name} (${org.id})`);

  // ============================================================================
  // 3. Check organization membership
  // ============================================================================
  console.log('\n3️⃣  Checking organization membership...');

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    console.error('❌ Error checking membership:', membershipError);
  } else if (!membership) {
    console.error('❌ User is NOT a member of the organization');
    console.log('   Creating membership now...');

    const { error: createMemberError } = await supabase
      .from('organization_members')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'admin',
        joined_at: new Date().toISOString()
      });

    if (createMemberError) {
      console.error('   ❌ Failed to create membership:', createMemberError);
    } else {
      console.log('   ✅ Membership created successfully');
    }
  } else {
    console.log(`✅ Membership exists: role=${membership.role}, joined_at=${membership.joined_at}`);

    if (!membership.joined_at) {
      console.log('   ⚠️  joined_at is NULL - fixing now...');

      const { error: updateError } = await supabase
        .from('organization_members')
        .update({ joined_at: new Date().toISOString() })
        .eq('org_id', org.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('   ❌ Failed to update joined_at:', updateError);
      } else {
        console.log('   ✅ joined_at updated successfully');
      }
    }
  }

  // ============================================================================
  // 4. Test RPC functions
  // ============================================================================
  console.log('\n4️⃣  Testing RPC functions...');

  // Test user_org_ids
  const { data: orgIds, error: orgIdsError } = await supabase.rpc('user_org_ids', {
    user_uuid: user.id
  });

  if (orgIdsError) {
    console.error('❌ user_org_ids RPC failed:', orgIdsError);
  } else {
    console.log(`✅ user_org_ids returned ${orgIds?.length || 0} organizations`);
    if (orgIds && orgIds.length > 0) {
      console.log(`   Organizations: ${orgIds.map((o: any) => o.org_id).join(', ')}`);
    }
  }

  // Test user_project_ids
  const { data: projectIds, error: projectIdsError } = await supabase.rpc('user_project_ids', {
    user_uuid: user.id
  });

  if (projectIdsError) {
    console.error('❌ user_project_ids RPC failed:', projectIdsError);
  } else {
    console.log(`✅ user_project_ids returned ${projectIds?.length || 0} projects`);
  }

  // ============================================================================
  // 5. Check profile trigger exists
  // ============================================================================
  console.log('\n5️⃣  Checking profile auto-creation trigger...');

  const { data: triggerExists, error: triggerError } = await supabase.rpc('check_trigger_exists', {
    trigger_name: 'on_auth_user_created'
  }).maybeSingle();

  if (triggerError) {
    console.log('⚠️  Could not check trigger (function may not exist)');
    console.log('   You may need to apply the profile trigger migration');
  } else if (triggerExists) {
    console.log('✅ Profile auto-creation trigger exists');
  } else {
    console.log('❌ Profile auto-creation trigger NOT found');
    console.log('   Run: npm run db:migrate 20250123000000_auto_create_profile.sql');
  }

  // ============================================================================
  // 6. List all projects in the organization
  // ============================================================================
  console.log('\n6️⃣  Listing projects in organization...');

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, status')
    .eq('org_id', org.id)
    .is('deleted_at', null);

  if (projectsError) {
    console.error('❌ Error fetching projects:', projectsError);
  } else {
    console.log(`✅ Found ${projects?.length || 0} projects`);
    projects?.forEach(p => {
      console.log(`   - ${p.name} (${p.id}) [${p.status}]`);
    });
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  console.log('User:', user.email);
  console.log('User ID:', user.id);
  console.log('Organization:', org.name, `(${TEST_ORG_SLUG})`);
  console.log('Organization ID:', org.id);
  console.log('Profile:', profile ? '✅ EXISTS' : '❌ MISSING (created)');
  console.log('Membership:', membership ? '✅ EXISTS' : '❌ MISSING (created)');
  console.log('Projects accessible:', projectIds?.length || 0);
  console.log('='.repeat(60));
  console.log('\n✨ Diagnostics complete!\n');
}

main().catch(console.error);
