/**
 * Check the upload invoice policy
 */

const { Client } = require('pg')

const databaseUrl = 'postgresql://postgres:fJ1XI7m5uBkvokYS@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres'

async function checkPolicy() {
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

    // Get policy with USING clause
    const result = await client.query(`
      SELECT
        pol.polname as policy_name,
        pol.polcmd as command,
        pg_catalog.pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
        pg_catalog.pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
      FROM pg_catalog.pg_policy pol
      JOIN pg_catalog.pg_class pc ON pol.polrelid = pc.oid
      JOIN pg_catalog.pg_namespace pn ON pc.relnamespace = pn.oid
      WHERE pn.nspname = 'storage'
        AND pc.relname = 'objects'
        AND pol.polname LIKE '%invoice%'
      ORDER BY pol.polname
    `)

    console.log('Invoice Storage Policies:')
    console.log(JSON.stringify(result.rows, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await client.end()
    console.log('\n📤 Database connection closed')
  }
}

checkPolicy()
