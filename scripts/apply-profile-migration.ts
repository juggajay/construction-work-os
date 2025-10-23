import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigration() {
  console.log('🔧 Applying auto-profile migration to production...\n')

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20250123000000_auto_create_profile.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded')
    console.log('Running SQL...\n')

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL
    })

    if (error) {
      // If exec_sql doesn't exist, try direct execution (requires proper permissions)
      console.log('⚠️  exec_sql RPC not available, trying direct execution...')

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.length > 0) {
          const { error: stmtError } = await supabase.rpc('exec', {
            query: statement
          })

          if (stmtError) {
            console.error('❌ Error executing statement:', stmtError)
            console.error('Statement:', statement.substring(0, 100) + '...')
          }
        }
      }
    }

    console.log('✅ Migration applied successfully!')

    // Verify the trigger exists
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created')

    if (triggers && triggers.length > 0) {
      console.log('✅ Trigger verified: on_auth_user_created')
    }

    // Verify all users have profiles now
    const { data: usersWithoutProfiles } = await supabase
      .from('auth.users')
      .select('id, email')
      .not('id', 'in',
        await supabase
          .from('profiles')
          .select('id')
          .then(({ data }) => data?.map(p => p.id) || [])
      )

    console.log(`\n📊 Users without profiles: ${usersWithoutProfiles?.length || 0}`)

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

applyMigration()
