/**
 * Fix storage bucket schema using direct connection
 */

const { Client } = require('pg')
const fs = require('fs')

// Direct connection (not pooler) - may have more privileges
const databaseUrl = 'postgresql://postgres:fJ1XI7m5uBkvokYS@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres'

async function fixSchema() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('📤 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!\n')

    // Read the migration file
    const sql = fs.readFileSync('supabase/migrations/20251029032850_fix_storage_buckets_schema.sql', 'utf8')

    console.log('📤 Executing storage schema fix...')
    const result = await client.query(sql)

    console.log('✅ Schema updated successfully!')
    console.log('\nResult:', result.rows)

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)

    // If we get permission error, provide workaround instructions
    if (error.message.includes('must be owner')) {
      console.log('\n📋 WORKAROUND NEEDED:\n')
      console.log('The storage.buckets table is a system table that requires superuser access.')
      console.log('You have two options:\n')
      console.log('Option 1: Recreate bucket via Supabase Dashboard (RECOMMENDED)')
      console.log('  1. Go to: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/storage/buckets')
      console.log('  2. Delete the project-invoices bucket')
      console.log('  3. Create new bucket with same name and these settings:')
      console.log('     - File size limit: 26214400 (25MB)')
      console.log('     - Allowed MIME types: application/pdf, image/jpeg, image/png, image/heic')
      console.log('  4. Re-add RLS policies from INVOICE_STORAGE_SETUP.md\n')
      console.log('Option 2: Downgrade Supabase client (TEMPORARY)')
      console.log('  npm install @supabase/supabase-js@2.38.0\n')
    }
  } finally {
    await client.end()
    console.log('\n📤 Database connection closed')
  }
}

fixSchema()
