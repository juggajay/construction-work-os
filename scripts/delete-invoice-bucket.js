/**
 * Delete project-invoices bucket so it can be recreated through Dashboard
 */

const { Client } = require('pg')

const databaseUrl = 'postgresql://postgres:fJ1XI7m5uBkvokYS@db.tokjmeqjvexnmtampyjm.supabase.co:5432/postgres'

async function deleteBucket() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected!\n')

    // Delete RLS policies first
    console.log('📤 Deleting RLS policies...')
    await client.query(`
      DROP POLICY IF EXISTS "Users can upload invoices to accessible projects" ON storage.objects;
      DROP POLICY IF EXISTS "Users can view invoices from accessible projects" ON storage.objects;
      DROP POLICY IF EXISTS "Managers and supervisors can delete invoices" ON storage.objects;
    `)
    console.log('✅ RLS policies deleted\n')

    // Delete the bucket
    console.log('📤 Deleting bucket...')
    await client.query(`
      DELETE FROM storage.buckets WHERE id = 'project-invoices';
    `)
    console.log('✅ Bucket deleted\n')

    console.log('🎉 Done! Now create the bucket through Supabase Dashboard:')
    console.log('   1. Go to: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/storage/buckets')
    console.log('   2. Click "New bucket"')
    console.log('   3. Name: project-invoices')
    console.log('   4. Public: No (keep private)')
    console.log('   5. File size limit: 26214400 (25MB)')
    console.log('   6. Allowed MIME types: application/pdf, image/jpeg, image/png, image/heic')
    console.log('   7. Click "Create bucket"')
    console.log('\n   Then add the RLS policies through the policies tab!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

deleteBucket()
