/**
 * Verify Production Schema
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🔍 Verifying production schema...\n');

  // Try to query with latitude/longitude
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, latitude, longitude, location_address')
    .limit(1);

  if (error) {
    console.error('❌ Schema check failed:', error.message);
    if (error.message.includes('latitude')) {
      console.log('\n⚠️  The latitude/longitude columns are missing in production!');
      console.log('   Run the migration: 20250123000002_add_project_location.sql');
    }
  } else {
    console.log('✅ Projects table has location columns');
    if (data && data.length > 0) {
      console.log(`\nSample project:`);
      console.log(`  Name: ${data[0].name}`);
      console.log(`  Latitude: ${data[0].latitude || 'NOT SET'}`);
      console.log(`  Longitude: ${data[0].longitude || 'NOT SET'}`);
    }
  }
}

main().catch(console.error);
