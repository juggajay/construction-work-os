import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import * as dotenv from 'dotenv'
import { join } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing')
  process.exit(1)
}

// Create Supabase admin client that bypasses RLS
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Test data IDs
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'
const SUPERVISOR_USER_ID = '00000000-0000-0000-0000-000000000002'
const TEST_ORG_ID = '00000000-0000-0000-0000-000000000010'
const TEST_PROJECT_ID = 'test-project-id'

async function cleanupTestData() {
  console.log('🧹 Starting test data cleanup...\n')

  try {
    // Step 1: Delete daily reports (cascade will handle entries)
    console.log('1️⃣  Deleting daily reports...')
    const { error: reportsError } = await supabase
      .from('daily_reports')
      .delete()
      .eq('project_id', TEST_PROJECT_ID)

    if (reportsError) {
      console.error('Error deleting daily reports:', reportsError.message)
    } else {
      console.log('✅ Deleted daily reports')
    }

    // Step 2: Delete project access
    console.log('\n2️⃣  Removing project access...')
    const { error: accessError } = await supabase
      .from('project_access')
      .delete()
      .eq('project_id', TEST_PROJECT_ID)

    if (accessError) {
      console.error('Error deleting project access:', accessError.message)
    } else {
      console.log('✅ Removed project access')
    }

    // Step 3: Delete project
    console.log('\n3️⃣  Deleting project...')
    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', TEST_PROJECT_ID)

    if (projectError) {
      console.error('Error deleting project:', projectError.message)
    } else {
      console.log('✅ Deleted project')
    }

    // Step 4: Delete organization members
    console.log('\n4️⃣  Removing organization members...')
    const { error: membersError } = await supabase
      .from('organization_members')
      .delete()
      .eq('org_id', TEST_ORG_ID)

    if (membersError) {
      console.error('Error deleting organization members:', membersError.message)
    } else {
      console.log('✅ Removed organization members')
    }

    // Step 5: Delete organization
    console.log('\n5️⃣  Deleting organization...')
    const { error: orgError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', TEST_ORG_ID)

    if (orgError) {
      console.error('Error deleting organization:', orgError.message)
    } else {
      console.log('✅ Deleted organization')
    }

    // Step 6: Delete profiles
    console.log('\n6️⃣  Deleting user profiles...')
    const { error: profile1Error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', TEST_USER_ID)

    const { error: profile2Error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', SUPERVISOR_USER_ID)

    if (profile1Error || profile2Error) {
      console.error('Error deleting profiles:', profile1Error || profile2Error)
    } else {
      console.log('✅ Deleted user profiles')
    }

    // Step 7: Delete auth users
    console.log('\n7️⃣  Deleting auth users...')

    const { error: user1Error } = await supabase.auth.admin.deleteUser(TEST_USER_ID)
    if (user1Error && !user1Error.message.includes('User not found')) {
      console.error('Error deleting regular user:', user1Error.message)
    } else {
      console.log('✅ Deleted regular user')
    }

    const { error: user2Error } = await supabase.auth.admin.deleteUser(SUPERVISOR_USER_ID)
    if (user2Error && !user2Error.message.includes('User not found')) {
      console.error('Error deleting supervisor user:', user2Error.message)
    } else {
      console.log('✅ Deleted supervisor user')
    }

    console.log('\n✅ Test data cleanup completed!')
    console.log('\n📊 Summary:')
    console.log('  - Deleted 2 users (test@example.com, supervisor@example.com)')
    console.log('  - Deleted organization: test-org')
    console.log('  - Deleted project: test-project-id')
    console.log('  - Deleted all associated daily reports and entries')
    console.log('\n🎉 Database cleaned! You can re-seed with: npm run test:e2e:seed')

  } catch (error) {
    console.error('\n❌ Error cleaning up test data:', error)
    process.exit(1)
  }
}

// Run the cleanup function
cleanupTestData()
