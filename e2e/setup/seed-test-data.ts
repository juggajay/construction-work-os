import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

// Test data IDs (deterministic)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'
const SUPERVISOR_USER_ID = '00000000-0000-0000-0000-000000000002'
const TEST_ORG_ID = '00000000-0000-0000-0000-000000000010'
const TEST_PROJECT_ID = 'test-project-id'
const DRAFT_REPORT_ID = 'draft-report-id'
const SUBMITTED_REPORT_ID = 'submitted-report-id'
const COMPLETE_DRAFT_ID = 'complete-draft-id'
const TEST_REPORT_ID = 'test-report-id'

async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n')

  try {
    // Step 1: Create test users via Supabase Auth
    console.log('1️⃣  Creating test users...')

    // Check if regular user exists
    const { data: existingUser } = await supabase.auth.admin.getUserById(TEST_USER_ID)

    if (!existingUser.user) {
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        id: TEST_USER_ID,
        email: 'test@example.com',
        password: 'password',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User',
        },
      })

      if (userError) {
        console.error('Error creating regular user:', userError.message)
      } else {
        console.log('✅ Created regular user: test@example.com')
      }
    } else {
      console.log('✅ Regular user already exists: test@example.com')
    }

    // Check if supervisor user exists
    const { data: existingSupervisor } = await supabase.auth.admin.getUserById(SUPERVISOR_USER_ID)

    if (!existingSupervisor.user) {
      const { data: supervisorData, error: supervisorError } = await supabase.auth.admin.createUser({
        id: SUPERVISOR_USER_ID,
        email: 'supervisor@example.com',
        password: 'password',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Supervisor',
        },
      })

      if (supervisorError) {
        console.error('Error creating supervisor user:', supervisorError.message)
      } else {
        console.log('✅ Created supervisor user: supervisor@example.com')
      }
    } else {
      console.log('✅ Supervisor user already exists: supervisor@example.com')
    }

    // Step 2: Create profiles
    console.log('\n2️⃣  Creating user profiles...')

    const { error: profileError1 } = await supabase
      .from('profiles')
      .upsert({
        id: TEST_USER_ID,
        full_name: 'Test User',
        settings: {},
      })

    if (profileError1) {
      console.error('Error creating regular user profile:', profileError1.message)
    } else {
      console.log('✅ Created profile for Test User')
    }

    const { error: profileError2 } = await supabase
      .from('profiles')
      .upsert({
        id: SUPERVISOR_USER_ID,
        full_name: 'Test Supervisor',
        settings: {},
      })

    if (profileError2) {
      console.error('Error creating supervisor profile:', profileError2.message)
    } else {
      console.log('✅ Created profile for Test Supervisor')
    }

    // Step 3: Create organization
    console.log('\n3️⃣  Creating test organization...')

    const { error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: TEST_ORG_ID,
        name: 'Test Organization',
        slug: 'test-org',
        settings: {},
      })

    if (orgError) {
      console.error('Error creating organization:', orgError.message)
    } else {
      console.log('✅ Created organization: test-org')
    }

    // Step 4: Add users to organization
    console.log('\n4️⃣  Adding users to organization...')

    const { error: memberError1 } = await supabase
      .from('organization_members')
      .upsert({
        org_id: TEST_ORG_ID,
        user_id: TEST_USER_ID,
        role: 'member',
        joined_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id,user_id'
      })

    if (memberError1) {
      console.error('Error adding regular user to org:', memberError1.message)
    } else {
      console.log('✅ Added Test User to test-org')
    }

    const { error: memberError2 } = await supabase
      .from('organization_members')
      .upsert({
        org_id: TEST_ORG_ID,
        user_id: SUPERVISOR_USER_ID,
        role: 'admin',
        joined_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id,user_id'
      })

    if (memberError2) {
      console.error('Error adding supervisor to org:', memberError2.message)
    } else {
      console.log('✅ Added Test Supervisor to test-org (admin)')
    }

    // Step 5: Create project
    console.log('\n5️⃣  Creating test project...')

    const { error: projectError } = await supabase
      .from('projects')
      .upsert({
        id: TEST_PROJECT_ID,
        org_id: TEST_ORG_ID,
        name: 'Test Project',
        number: 'PRJ-001',
        status: 'active',
        address: '123 Test Street, Test City, TS 12345',
      })

    if (projectError) {
      console.error('Error creating project:', projectError.message)
    } else {
      console.log('✅ Created project: Test Project')
    }

    // Step 6: Add users to project
    console.log('\n6️⃣  Adding users to project...')

    const { error: accessError1 } = await supabase
      .from('project_access')
      .upsert({
        project_id: TEST_PROJECT_ID,
        user_id: TEST_USER_ID,
        role: 'viewer',
      }, {
        onConflict: 'project_id,user_id'
      })

    if (accessError1) {
      console.error('Error adding regular user to project:', accessError1.message)
    } else {
      console.log('✅ Added Test User to project')
    }

    const { error: accessError2 } = await supabase
      .from('project_access')
      .upsert({
        project_id: TEST_PROJECT_ID,
        user_id: SUPERVISOR_USER_ID,
        role: 'supervisor',
      }, {
        onConflict: 'project_id,user_id'
      })

    if (accessError2) {
      console.error('Error adding supervisor to project:', accessError2.message)
    } else {
      console.log('✅ Added Test Supervisor to project (supervisor)')
    }

    // Step 7: Create daily reports
    console.log('\n7️⃣  Creating daily reports...')

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0]
    const threeDaysAgo = new Date(Date.now() - 259200000).toISOString().split('T')[0]

    // Draft Report
    const { error: draftError } = await supabase
      .from('daily_reports')
      .upsert({
        id: DRAFT_REPORT_ID,
        project_id: TEST_PROJECT_ID,
        created_by: TEST_USER_ID,
        report_date: today,
        status: 'draft',
        weather_condition: 'clear',
        temperature_high: 75,
        temperature_low: 55,
        narrative: 'This is a draft daily report for testing.',
      })

    if (draftError) {
      console.error('Error creating draft report:', draftError.message)
    } else {
      console.log('✅ Created draft report')
    }

    // Submitted Report
    const { error: submittedError } = await supabase
      .from('daily_reports')
      .upsert({
        id: SUBMITTED_REPORT_ID,
        project_id: TEST_PROJECT_ID,
        created_by: TEST_USER_ID,
        submitted_by: TEST_USER_ID,
        report_date: yesterday,
        status: 'submitted',
        weather_condition: 'partly_cloudy',
        temperature_high: 72,
        temperature_low: 58,
        narrative: 'This is a submitted daily report waiting for approval.',
        submitted_at: new Date().toISOString(),
      })

    if (submittedError) {
      console.error('Error creating submitted report:', submittedError.message)
    } else {
      console.log('✅ Created submitted report')
    }

    // Complete Draft (ready to submit)
    const { error: completeError } = await supabase
      .from('daily_reports')
      .upsert({
        id: COMPLETE_DRAFT_ID,
        project_id: TEST_PROJECT_ID,
        created_by: TEST_USER_ID,
        report_date: twoDaysAgo,
        status: 'draft',
        weather_condition: 'overcast',
        temperature_high: 68,
        temperature_low: 52,
        precipitation: 0.5,
        wind_speed: 12,
        humidity: 75,
        narrative: 'Complete draft report with all fields filled. Ready to submit.',
      })

    if (completeError) {
      console.error('Error creating complete draft:', completeError.message)
    } else {
      console.log('✅ Created complete draft report')
    }

    // Generic Test Report
    const { error: testReportError } = await supabase
      .from('daily_reports')
      .upsert({
        id: TEST_REPORT_ID,
        project_id: TEST_PROJECT_ID,
        created_by: TEST_USER_ID,
        report_date: threeDaysAgo,
        status: 'draft',
        weather_condition: 'clear',
        temperature_high: 78,
        temperature_low: 60,
        narrative: 'Generic test report for viewing and testing.',
      })

    if (testReportError) {
      console.error('Error creating test report:', testReportError.message)
    } else {
      console.log('✅ Created generic test report')
    }

    console.log('\n✅ Test data seeded successfully!')
    console.log('\n📊 Summary:')
    console.log('  - Users: test@example.com, supervisor@example.com')
    console.log('  - Organization: test-org')
    console.log('  - Project: test-project-id')
    console.log('  - Daily Reports: 4 (draft, submitted, complete draft, test report)')
    console.log('\n🎉 All done! You can now run E2E tests.')

  } catch (error) {
    console.error('\n❌ Error seeding test data:', error)
    process.exit(1)
  }
}

// Run the seeding function
seedTestData()
