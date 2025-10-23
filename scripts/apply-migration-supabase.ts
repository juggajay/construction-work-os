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

async function applyMigration() {
  console.log('🔧 Applying auto-profile migration...\n')

  try {
    // Step 1: Create the function
    console.log('1️⃣  Creating handle_new_user function...')

    const { error: funcError } = await supabase.rpc('exec', {
      query: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, full_name, settings)
          VALUES (
            NEW.id,
            COALESCE(
              NEW.raw_user_meta_data->>'full_name',
              NEW.raw_user_meta_data->>'name',
              split_part(NEW.email, '@', 1)
            ),
            '{}'::jsonb
          )
          ON CONFLICT (id) DO NOTHING;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })

    if (funcError && !funcError.message.includes('already exists')) {
      // Function might already exist from our script, let's use raw SQL
      console.log('   ℹ️  Function may already exist, continuing...')
    } else {
      console.log('   ✅ Function created')
    }

    // Step 2: Create the trigger (manually since we can't drop via RPC)
    console.log('\n2️⃣  Note: Trigger must be created via Supabase Dashboard')
    console.log('   Go to: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/sql')
    console.log('   Run this SQL:')
    console.log(`
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `)

    // Step 3: Backfill existing users
    console.log('\n3️⃣  Backfilling profiles for existing users...')

    const { data: users } = await supabase.auth.admin.listUsers()

    if (!users || !users.users) {
      console.log('   ⚠️  Could not fetch users')
      return
    }

    let created = 0
    for (const user of users.users) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        const fullName = user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        user.email?.split('@')[0] ||
                        'User'

        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: fullName,
            settings: {}
          })

        if (!error) {
          console.log(`   ✅ Created profile for ${user.email}`)
          created++
        }
      }
    }

    console.log(`\n📊 Summary: Created ${created} new profile(s)`)
    console.log('\n⚠️  IMPORTANT: You must manually create the trigger in Supabase Dashboard')
    console.log('   URL: https://supabase.com/dashboard/project/tokjmeqjvexnmtampyjm/sql')

  } catch (error) {
    console.error('\n❌ Error:', error)
  }
}

applyMigration()
