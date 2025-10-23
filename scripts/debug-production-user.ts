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

async function debugProductionUser() {
  console.log('🔍 Debugging production user organization access...\n')

  try {
    // List all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    console.log(`📊 Total users: ${users.length}\n`)

    for (const user of users) {
      console.log(`\n👤 User: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)

      // Check profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        console.log(`   Profile: ✅ ${profile.full_name}`)
      } else {
        console.log(`   Profile: ❌ Missing`)
      }

      // Check organization memberships
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('org_id, role')
        .eq('user_id', user.id)

      if (memberships && memberships.length > 0) {
        console.log(`   Organizations: ${memberships.length}`)

        for (const membership of memberships) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name, slug')
            .eq('id', membership.org_id)
            .single()

          if (org) {
            console.log(`     - ${org.name} (${org.slug}) - Role: ${membership.role}`)
          }
        }
      } else {
        console.log(`   Organizations: ❌ None (THIS IS THE PROBLEM!)`)
      }
    }

    // List all organizations
    console.log('\n\n🏢 All Organizations:')
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, slug')

    if (orgs && orgs.length > 0) {
      for (const org of orgs) {
        console.log(`   - ${org.name} (${org.slug})`)
        console.log(`     ID: ${org.id}`)
      }
    } else {
      console.log('   ❌ No organizations exist')
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
  }
}

debugProductionUser()
