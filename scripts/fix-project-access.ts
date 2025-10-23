/**
 * Fix Project Access
 *
 * This script ensures the user has proper project_access entries
 * which are required for RFI creation (is_project_manager check)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_USER_EMAIL = 'jaysonryan21@hotmail.com';
const TEST_ORG_SLUG = 'ryox-carpentry';

async function main() {
  console.log('🔧 Fixing Project Access...\n');

  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get user
  const { data: authUser } = await supabase.auth.admin.listUsers();
  const user = authUser.users.find(u => u.email === TEST_USER_EMAIL);

  if (!user) {
    console.error(`❌ User ${TEST_USER_EMAIL} not found`);
    return;
  }

  console.log(`✅ User found: ${user.id}`);

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', TEST_ORG_SLUG)
    .single();

  if (orgError || !org) {
    console.error(`❌ Organization '${TEST_ORG_SLUG}' not found`);
    return;
  }

  console.log(`✅ Organization found: ${org.name} (${org.id})\n`);

  // Get all projects in the organization
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, status')
    .eq('org_id', org.id)
    .is('deleted_at', null);

  if (projectsError || !projects || projects.length === 0) {
    console.error('❌ No projects found in organization');
    return;
  }

  console.log(`Found ${projects.length} projects in organization:\n`);

  // Check and fix project access for each project
  for (const project of projects) {
    console.log(`📁 ${project.name} (${project.id})`);

    // Check if user already has project access
    const { data: existingAccess, error: accessError } = await supabase
      .from('project_access')
      .select('*')
      .eq('project_id', project.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (accessError) {
      console.error(`   ❌ Error checking access:`, accessError.message);
      continue;
    }

    if (existingAccess) {
      console.log(`   ✅ Access exists: role=${existingAccess.role}`);

      // Check if needs to be updated to manager
      if (existingAccess.role !== 'manager') {
        console.log(`   ⚠️  Updating role to 'manager'...`);

        const { error: updateError } = await supabase
          .from('project_access')
          .update({ role: 'manager' })
          .eq('project_id', project.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`   ❌ Failed to update:`, updateError.message);
        } else {
          console.log(`   ✅ Role updated to 'manager'`);
        }
      }
    } else {
      console.log(`   ❌ No access entry found - creating now...`);

      const { error: insertError } = await supabase
        .from('project_access')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'manager',
          granted_by: user.id,
        });

      if (insertError) {
        console.error(`   ❌ Failed to create access:`, insertError.message);
      } else {
        console.log(`   ✅ Project access created with role='manager'`);
      }
    }

    console.log('');
  }

  // Verify is_project_manager works now
  console.log('🧪 Verifying is_project_manager RPC...\n');

  for (const project of projects) {
    const { data: isManager, error: isManagerError } = await supabase.rpc('is_project_manager', {
      user_uuid: user.id,
      check_project_id: project.id,
    });

    if (isManagerError) {
      console.log(`❌ ${project.name}: RPC failed -`, isManagerError.message);
    } else {
      console.log(`${isManager ? '✅' : '❌'} ${project.name}: is_project_manager = ${isManager}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Project access fix complete!');
  console.log('='.repeat(60));
  console.log('\nThe user should now be able to:');
  console.log('✅ Create Daily Reports');
  console.log('✅ Create Submittals');
  console.log('✅ Create RFIs');
  console.log('');
}

main().catch(console.error);
