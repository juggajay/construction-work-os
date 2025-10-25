/**
 * Create project-invoices storage bucket using Supabase Admin API
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createBucket() {
  console.log('📤 Creating project-invoices storage bucket...')

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('project-invoices', {
    public: false,
    fileSizeLimit: 26214400, // 25MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
  })

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Bucket already exists')
    } else {
      console.error('❌ Error creating bucket:', error.message)
      process.exit(1)
    }
  } else {
    console.log('✅ Bucket created successfully:', data)
  }

  console.log('\n✅ Storage bucket is ready!')
  console.log('🎉 You can now upload invoices')
}

createBucket().catch(err => {
  console.error('❌ Failed to create bucket:', err)
  process.exit(1)
})
