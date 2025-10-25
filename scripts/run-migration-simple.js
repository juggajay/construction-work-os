/**
 * Run storage bucket migration - simple version
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
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251025143840_create_project_invoices_storage_bucket.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📤 Executing migration...\n')

    await client.query(sql)

    console.log('\n✅ Migration completed successfully!')
    console.log('🎉 The project-invoices storage bucket is now ready!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)

    // If it's an "already exists" error, that's okay
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('\n⚠️  Storage bucket or policies may already exist')
      console.log('✅ This is fine - invoice upload should work!')
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
