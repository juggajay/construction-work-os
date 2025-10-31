/**
 * Check storage configuration and tables
 */

const { Client } = require('pg')

const databaseUrl = 'postgresql://postgres:fJ1XI7m5uBkvokYS@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres'

async function checkConfig() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected!\n')

    // List all tables in storage schema
    console.log('📝 All tables in storage schema:')
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'storage'
      ORDER BY table_name
    `)
    console.log(tables.rows.map(r => r.table_name).join('\n'))

    // Check storage.buckets schema
    console.log('\n📝 storage.buckets columns:')
    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'storage' AND table_name = 'buckets'
      ORDER BY ordinal_position
    `)
    console.log(JSON.stringify(columns.rows, null, 2))

    // Try to call Supabase storage.get_object if it exists
    console.log('\n📝 Trying to list objects in project-invoices bucket:')
    try {
      const objects = await client.query(`
        SELECT * FROM storage.objects
        WHERE bucket_id = 'project-invoices'
        LIMIT 5
      `)
      console.log(`Found ${objects.rows.length} objects`)
    } catch (err) {
      console.log(`Error: ${err.message}`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

checkConfig()
