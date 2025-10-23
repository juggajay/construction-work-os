/**
 * Check and Fix Project Location
 *
 * Daily Reports require project coordinates to fetch weather data
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_ORG_SLUG = 'ryox-carpentry';

// Default location: New York City (can be updated)
const DEFAULT_LATITUDE = 40.7128;
const DEFAULT_LONGITUDE = -74.0060;

async function main() {
  console.log('📍 Checking Project Locations...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', TEST_ORG_SLUG)
    .single();

  if (orgError || !org) {
    console.error(`❌ Organization '${TEST_ORG_SLUG}' not found`);
    return;
  }

  console.log(`✅ Organization: ${org.name}\n`);

  // Get all projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, latitude, longitude, location_address')
    .eq('org_id', org.id)
    .is('deleted_at', null);

  if (projectsError || !projects || projects.length === 0) {
    console.error('❌ No projects found');
    return;
  }

  console.log(`Found ${projects.length} projects:\n`);

  for (const project of projects) {
    console.log(`📁 ${project.name}`);
    console.log(`   ID: ${project.id}`);

    if (project.latitude && project.longitude) {
      console.log(`   ✅ Location set: ${project.latitude}, ${project.longitude}`);
      if (project.location_address) {
        console.log(`   Address: ${project.location_address}`);
      }
    } else {
      console.log(`   ❌ Location NOT set - daily reports will require manual weather entry`);
      console.log(`   ⚠️  Setting default location (NYC) for testing...`);

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          latitude: DEFAULT_LATITUDE,
          longitude: DEFAULT_LONGITUDE,
          location_address: 'New York, NY (Default - Please Update)',
        })
        .eq('id', project.id);

      if (updateError) {
        console.error(`   ❌ Failed to update location:`, updateError.message);
      } else {
        console.log(`   ✅ Location updated to ${DEFAULT_LATITUDE}, ${DEFAULT_LONGITUDE}`);
        console.log(`   ⚠️  Remember to update this to the actual project location!`);
      }
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('✨ Location check complete!');
  console.log('='.repeat(60));
  console.log('\nNote: Projects need valid coordinates for Daily Reports');
  console.log('to automatically fetch weather data.\n');
}

main().catch(console.error);
