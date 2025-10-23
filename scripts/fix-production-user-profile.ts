import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function fixProductionUserProfile() {
  console.log('🔧 Fixing production user profile...\n')

  const PRODUCTION_USER_ID = '01f2e8b7-dbcf-4823-8b78-88e2036384d5'
  const PRODUCTION_USER_EMAIL = 'jaysonryan21@hotmail.com'

  try {
    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(PRODUCTION_USER_ID)

    if (userError || !user) {
      console.error('❌ Error fetching user:', userError)
      return
    }

    console.log(`👤 User: ${user.email}`)
    console.log(`   ID: ${user.id}`)

    // Extract name from email or metadata
    let fullName = user.user_metadata?.full_name ||
                   user.user_metadata?.name ||
                   user.email?.split('@')[0] ||
                   'User'

    console.log(`\n📝 Creating profile with name: ${fullName}`)

    // Create or update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        settings: {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
      return
    }

    console.log('✅ Profile created/updated successfully!')

    // Verify organization membership
    const { data: memberships } = await supabase
      .from('organization_members')
      .select(`
        org_id,
        role,
        organizations (
          name,
          slug
        )
      `)
      .eq('user_id', user.id)

    if (memberships && memberships.length > 0) {
      console.log(`\n🏢 User has access to ${memberships.length} organization(s):`)
      for (const membership of memberships) {
        const org = membership.organizations as any
        console.log(`   ✅ ${org.name} (${org.slug}) - Role: ${membership.role}`)
      }
    } else {
      console.log('\n⚠️  User has no organization memberships')
    }

    console.log('\n✅ Fix completed! User should now be able to access their organization.')

  } catch (error) {
    console.error('\n❌ Error:', error)
  }
}

fixProductionUserProfile()
