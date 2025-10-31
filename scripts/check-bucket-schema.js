/**
 * Check storage bucket schema
 */

const { Client } = require('pg')

const databaseUrl = 'postgresql://postgres:fJ1XI7m5uBkvokYS@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres'

async function checkSchema() {
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

    // Get storage.buckets table columns
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'storage'
        AND table_name = 'buckets'
      ORDER BY ordinal_position
    `)

    console.log('Storage.buckets table schema:')
    console.log(JSON.stringify(result.rows, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await client.end()
    console.log('\n📤 Database connection closed')
  }
}

checkSchema()
