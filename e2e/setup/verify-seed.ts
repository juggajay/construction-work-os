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
  console.error('❌ Error: Missing required environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

// Create Supabase admin client
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

async function verifyTestData() {
  console.log('🔍 Verifying test data...\n')

  let allChecks = true

  try {
    // Check users
    console.log('1️⃣  Checking test users...')

    const { data: user1 } = await supabase.auth.admin.getUserById(TEST_USER_ID)
    if (user1.user) {
      console.log('  ✅ Regular user exists: test@example.com')
    } else {
      console.log('  ❌ Regular user NOT found')
      allChecks = false
    }

    const { data: user2 } = await supabase.auth.admin.getUserById(SUPERVISOR_USER_ID)
    if (user2.user) {
      console.log('  ✅ Supervisor user exists: supervisor@example.com')
    } else {
      console.log('  ❌ Supervisor user NOT found')
      allChecks = false
    }

    // Check profiles
    console.log('\n2️⃣  Checking profiles...')

    const { data: profile1 } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', TEST_USER_ID)
      .single()

    if (profile1) {
      console.log(`  ✅ Profile exists for ${profile1.full_name}`)
    } else {
      console.log('  ❌ Profile NOT found for test user')
      allChecks = false
    }

    const { data: profile2 } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', SUPERVISOR_USER_ID)
      .single()

    if (profile2) {
      console.log(`  ✅ Profile exists for ${profile2.full_name}`)
    } else {
      console.log('  ❌ Profile NOT found for supervisor')
      allChecks = false
    }

    // Check organization
    console.log('\n3️⃣  Checking organization...')

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', TEST_ORG_ID)
      .single()

    if (org) {
      console.log(`  ✅ Organization exists: ${org.name} (${org.slug})`)
    } else {
      console.log('  ❌ Organization NOT found')
      allChecks = false
    }

    // Check organization members
    console.log('\n4️⃣  Checking organization members...')

    const { data: members } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', TEST_ORG_ID)

    if (members && members.length === 2) {
      console.log(`  ✅ Found ${members.length} organization members`)
      members.forEach(m => {
        console.log(`    - User: ${m.user_id === TEST_USER_ID ? 'test@example.com' : 'supervisor@example.com'} (${m.role})`)
      })
    } else {
      console.log(`  ❌ Expected 2 members, found ${members?.length || 0}`)
      allChecks = false
    }

    // Check project
    console.log('\n5️⃣  Checking project...')

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', TEST_PROJECT_ID)
      .single()

    if (project) {
      console.log(`  ✅ Project exists: ${project.name} (${project.id})`)
    } else {
      console.log('  ❌ Project NOT found')
      allChecks = false
    }

    // Check project access
    console.log('\n6️⃣  Checking project access...')

    const { data: access } = await supabase
      .from('project_access')
      .select('*')
      .eq('project_id', TEST_PROJECT_ID)

    if (access && access.length === 2) {
      console.log(`  ✅ Found ${access.length} users with project access`)
      access.forEach(a => {
        console.log(`    - User: ${a.user_id === TEST_USER_ID ? 'test@example.com' : 'supervisor@example.com'} (${a.role})`)
      })
    } else {
      console.log(`  ❌ Expected 2 access records, found ${access?.length || 0}`)
      allChecks = false
    }

    // Check daily reports
    console.log('\n7️⃣  Checking daily reports...')

    const { data: reports, count } = await supabase
      .from('daily_reports')
      .select('*', { count: 'exact' })
      .eq('project_id', TEST_PROJECT_ID)

    if (reports && reports.length >= 4) {
      console.log(`  ✅ Found ${reports.length} daily reports`)
      reports.forEach(r => {
        console.log(`    - Report: ${r.id} (${r.status}, ${r.report_date})`)
      })
    } else {
      console.log(`  ❌ Expected at least 4 reports, found ${reports?.length || 0}`)
      allChecks = false
    }

    // Final summary
    console.log('\n' + '='.repeat(50))
    if (allChecks) {
      console.log('✅ ALL CHECKS PASSED!')
      console.log('🎉 Test data is properly seeded and ready for E2E tests.')
    } else {
      console.log('❌ SOME CHECKS FAILED!')
      console.log('Run: npm run test:e2e:seed')
    }
    console.log('='.repeat(50))

    process.exit(allChecks ? 0 : 1)

  } catch (error) {
    console.error('\n❌ Error verifying test data:', error)
    process.exit(1)
  }
}

// Run verification
verifyTestData()
