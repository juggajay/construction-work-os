/**
 * Fix Project Location
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Default to NYC
const DEFAULT_LATITUDE = 40.7128;
const DEFAULT_LONGITUDE = -74.0060;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .is('deleted_at', null);

  console.log(`Found ${projects?.length || 0} active projects\n`);

  for (const project of projects || []) {
    if (!project.latitude || !project.longitude) {
      console.log(`📁 ${project.name}: Missing location - fixing...`);

      const { error } = await supabase
        .from('projects')
        .update({
          latitude: DEFAULT_LATITUDE,
          longitude: DEFAULT_LONGITUDE,
          location_address: 'New York, NY (Default - Please Update)',
        })
        .eq('id', project.id);

      if (error) {
        console.error(`   ❌ Failed:`, error.message);
      } else {
        console.log(`   ✅ Location set to ${DEFAULT_LATITUDE}, ${DEFAULT_LONGITUDE}`);
      }
    } else {
      console.log(`📁 ${project.name}: ✅ Location already set`);
    }
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
