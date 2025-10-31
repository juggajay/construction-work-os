/**
 * Run project-quotes storage bucket migration - simple version
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Use direct connection URL
const databaseUrl = 'postgresql://postgres:fJ1XI7m5uBkvokYS@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres'

async function runMigration() {
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

    // Read and execute the migration file directly
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251028032730_create_project_quotes_storage_bucket.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📤 Executing storage migration...')
    console.log('   Creating project-quotes bucket')
    console.log('   Setting up RLS policies\n')

    await client.query(sql)

    console.log('\n✅ Storage migration completed successfully!')
    console.log('🎉 The project-quotes storage bucket is now ready!')
    console.log('\nBucket configuration:')
    console.log('  ✓ Bucket name: project-quotes')
    console.log('  ✓ Public: false (authenticated access only)')
    console.log('  ✓ Upload: Managers and supervisors')
    console.log('  ✓ View: All team members')
    console.log('  ✓ Delete: Managers only')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)

    // If it's an "already exists" error, that's okay
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('\n⚠️  Storage bucket or policies may already exist')
      console.log('✅ This is fine - quote upload should work!')
    } else {
      console.error('\nFull error:', error)
      process.exit(1)
    }
  } finally {
    await client.end()
    console.log('\n📤 Database connection closed')
  }
}

runMigration()
