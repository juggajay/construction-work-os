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

async function checkActualColumns() {
  console.log('🔍 Checking ACTUAL columns in production daily_reports table...\n')

  // Try a simple select to see what PostgREST knows about
  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error querying table:', error.message)
    console.error('Details:', error)
  } else {
    console.log('✅ Table is accessible')
    if (data && data.length > 0) {
      console.log('\n📊 Columns found in first row:')
      Object.keys(data[0]).sort().forEach(col => {
        console.log(`  - ${col}`)
      })
    } else {
      console.log('\n⚠️  No rows in table, cannot determine columns from data')
    }
  }

  console.log('\n📋 Creating SQL query to check schema directly...\n')
  console.log('Run this in Supabase SQL Editor:')
  console.log('=' .repeat(60))
  console.log(`
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'daily_reports'
ORDER BY ordinal_position;
  `)
  console.log('=' .repeat(60))
}

checkActualColumns()
