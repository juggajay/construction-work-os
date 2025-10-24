import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const USER_ID = '01f2e8b7-dbcf-4823-8b78-88e2036384d5'
const PROJECT_ID = 'b694bd30-93d0-41dc-bda6-aadc9fa3ca57'

async function testDailyReportCreation() {
  console.log('🧪 Testing Daily Report Creation...\n')

  // Step 1: Verify profile exists
  console.log('1️⃣  Checking profile...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', USER_ID)
    .single()

  if (profileError || !profile) {
    console.error('❌ Profile not found!')
    console.error('Creating profile...')

    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        id: USER_ID,
        full_name: 'jayson ryan',
        settings: {}
      })

    if (createError) {
      console.error('❌ Could not create profile:', createError.message)
      return
    }
    console.log('✅ Profile created')
  } else {
    console.log(`✅ Profile exists: ${profile.full_name}`)
  }

  // Step 2: Try to create a test daily report
  console.log('\n2️⃣  Attempting to create daily report...')

  const testReport = {
    project_id: PROJECT_ID,
    created_by: USER_ID,
    report_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    narrative: 'Test report from diagnostic script',
    weather_condition: 'clear',
    temperature_high: 75,
    temperature_low: 55,
  }

  const { data: report, error: reportError } = await supabase
    .from('daily_reports')
    .insert(testReport)
    .select()
    .single()

  if (reportError) {
    console.error('❌ Failed to create report!')
    console.error('Error code:', reportError.code)
    console.error('Error message:', reportError.message)
    console.error('Error details:', reportError.details)
    console.error('Error hint:', reportError.hint)

    // Specific checks
    if (reportError.message.includes('foreign key')) {
      console.log('\n🔍 Foreign key constraint failed')
      console.log('Checking which FK is the problem...')

      // Check if user exists in auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(USER_ID)
      console.log('Auth user exists:', authUser.user ? '✅ YES' : '❌ NO')

      // Check if project exists
      const { data: proj } = await supabase
        .from('projects')
        .select('id')
        .eq('id', PROJECT_ID)
        .single()
      console.log('Project exists:', proj ? '✅ YES' : '❌ NO')
    }

    if (reportError.message.includes('schema cache')) {
      console.log('\n🔍 Schema cache issue detected')
      console.log('Run this SQL in Supabase:')
      console.log('  NOTIFY pgrst, \'reload schema\';')
    }

  } else {
    console.log('✅ Report created successfully!')
    console.log('Report ID:', report.id)

    // Clean up test report
    console.log('\n3️⃣  Cleaning up test report...')
    await supabase
      .from('daily_reports')
      .delete()
      .eq('id', report.id)
    console.log('✅ Test report deleted')
  }
}

testDailyReportCreation()
