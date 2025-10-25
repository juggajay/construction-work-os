/**
 * Run storage bucket migration directly via PostgreSQL connection
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Use direct connection URL (not pooler) with simple postgres username
const databaseUrl = 'postgresql://postgres:fJ1XI7m5uBkvokYS@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres'

async function runMigration() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Accept self-signed certificates
    }
  })

  try {
    console.log('📤 Connecting to database...')
    await client.connect()
    console.log('✅ Connected!')

    // Read the migration SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251025143840_create_project_invoices_storage_bucket.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Split into statements (simple split on semicolons, filtering comments)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => !s.startsWith('--'))
      .filter(s => !s.match(/^\/\*/))

    console.log(`\n📝 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Skip comments and empty lines
      if (statement.trim().startsWith('--') || statement.trim().length < 5) {
        continue
      }

      console.log(`📤 Executing statement ${i + 1}/${statements.length}...`)
      console.log(statement.substring(0, 80) + '...\n')

      try {
        await client.query(statement)
        console.log(`✅ Statement ${i + 1} executed successfully\n`)
      } catch (err) {
        // Check if it's a "already exists" error
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`⚠️  Object already exists (skipping): ${err.message}\n`)
          continue
        }
        throw err
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('🎉 The project-invoices storage bucket is now ready!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n📤 Database connection closed')
  }
}

runMigration()
