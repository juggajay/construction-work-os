/**
 * Apply storage bucket migration to production
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('📤 Applying storage bucket migration...')

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251025143840_create_project_invoices_storage_bucket.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/**'))

  console.log(`📝 Found ${statements.length} SQL statements to execute`)

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    console.log(`\n📤 Executing statement ${i + 1}/${statements.length}...`)
    console.log(statement.substring(0, 100) + '...')

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: statement
    })

    if (error) {
      console.error(`❌ Error executing statement ${i + 1}:`, error.message)
      console.error('Statement:', statement)

      // Continue if it's a "already exists" error
      if (error.message.includes('already exists') || error.message.includes('ON CONFLICT')) {
        console.log('⚠️  Continuing (object may already exist)...')
        continue
      }

      process.exit(1)
    }

    console.log(`✅ Statement ${i + 1} executed successfully`)
  }

  console.log('\n✅ Migration applied successfully!')
  console.log('🎉 The project-invoices storage bucket is now ready')
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
