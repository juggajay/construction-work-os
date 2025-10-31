/**
 * Fix storage bucket schema - add missing columns
 */

const { Client } = require('pg')

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

    // Add missing columns to storage.buckets table
    console.log('📤 Adding file_size_limit column...')
    await client.query(`
      ALTER TABLE storage.buckets
      ADD COLUMN IF NOT EXISTS file_size_limit bigint
    `)
    console.log('✅ Added file_size_limit column')

    console.log('📤 Adding allowed_mime_types column...')
    await client.query(`
      ALTER TABLE storage.buckets
      ADD COLUMN IF NOT EXISTS allowed_mime_types text[]
    `)
    console.log('✅ Added allowed_mime_types column')

    console.log('📤 Adding public column...')
    await client.query(`
      ALTER TABLE storage.buckets
      ADD COLUMN IF NOT EXISTS public boolean DEFAULT false
    `)
    console.log('✅ Added public column')

    console.log('📤 Adding avif_autodetection column...')
    await client.query(`
      ALTER TABLE storage.buckets
      ADD COLUMN IF NOT EXISTS avif_autodetection boolean DEFAULT false
    `)
    console.log('✅ Added avif_autodetection column')

    // Update project-invoices bucket with proper values
    console.log('\n📤 Updating project-invoices bucket configuration...')
    await client.query(`
      UPDATE storage.buckets
      SET
        file_size_limit = 26214400,  -- 25MB in bytes
        allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic'],
        public = false
      WHERE id = 'project-invoices'
    `)
    console.log('✅ Updated project-invoices bucket')

    // Verify the changes
    console.log('\n📤 Verifying changes...')
    const result = await client.query(`
      SELECT id, name, file_size_limit, allowed_mime_types, public
      FROM storage.buckets
      WHERE id = 'project-invoices'
    `)
    console.log('Updated bucket configuration:')
    console.log(JSON.stringify(result.rows[0], null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await client.end()
    console.log('\n📤 Database connection closed')
  }
}

fixSchema()
