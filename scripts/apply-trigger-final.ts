import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyTrigger() {
  console.log('🔧 Creating auto-profile trigger via Supabase REST API...\n')

  try {
    // The Supabase REST API doesn't support creating triggers directly
    // So we'll output instructions for the user to copy-paste

    console.log('📋 COPY THIS EXACT TEXT (between the lines) into Supabase SQL Editor:')
    console.log('=' .repeat(80))
    console.log(`CREATE OR REPLACE FUNCTION public.handle_new_user()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;`)
    console.log('=' .repeat(80))

    console.log('\n✅ After the function is created, run this SECOND query:')
    console.log('=' .repeat(80))
    console.log(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`)
    console.log('=' .repeat(80))

    console.log('\n📍 Alternative: Just tell me and I\'ll create profiles manually for all new users.')
    console.log('   Since all EXISTING users already have profiles, this might be sufficient.')
    console.log('\n💡 The app will work RIGHT NOW for all current users!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

applyTrigger()
