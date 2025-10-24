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

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking daily_reports table schema...\n')

  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .limit(0)

  if (error) {
    console.error('❌ Error:', error.message)
    console.error('\nDetails:', error)
  } else {
    console.log('✅ Table accessible')
  }

  // Try to get actual column info
  console.log('\n📊 Trying to query table structure...')

  const { data: columns, error: colError } = await supabase
    .rpc('exec', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'daily_reports'
        ORDER BY ordinal_position;
      `
    })

  if (columns) {
    console.log('\nColumns found:')
    console.log(columns)
  } else if (colError) {
    console.log('\nCannot query columns via RPC')
  }
}

checkSchema()
