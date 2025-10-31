/**
 * Check if project-invoices storage bucket exists
 */

const { Client } = require('pg')

// Use direct connection URL
const databaseUrl = 'postgresql://postgres:fJ1XI7m5uBkvokYS@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres'

async function checkBucket() {
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

    // Check if bucket exists
    const result = await client.query(`
      SELECT id, name, created_at
      FROM storage.buckets
      WHERE id = 'project-invoices'
    `)

    if (result.rows.length > 0) {
      console.log('✅ Bucket exists!')
      console.log(JSON.stringify(result.rows[0], null, 2))
    } else {
      console.log('❌ Bucket does NOT exist')
    }

    // List all buckets
    console.log('\n📝 All storage buckets:')
    const allBuckets = await client.query(`
      SELECT id, name, created_at
      FROM storage.buckets
      ORDER BY created_at DESC
    `)
    console.log(JSON.stringify(allBuckets.rows, null, 2))

    // Check RLS policies
    console.log('\n📝 Storage RLS policies on storage.objects:')
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname, cmd, qual
      FROM pg_policies
      WHERE tablename = 'objects' AND schemaname = 'storage'
      ORDER BY policyname
    `)
    console.log(JSON.stringify(policies.rows, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await client.end()
    console.log('\n📤 Database connection closed')
  }
}

checkBucket()
