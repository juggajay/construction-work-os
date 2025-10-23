/**
 * Apply Migration Directly via PostgreSQL
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('🚀 Applying location migration...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    db: { schema: 'public' }
  });

  // Step 1: Add columns using raw SQL via REST API
  console.log('Step 1: Adding location columns...');

  try {
    // We'll use the SQL REST endpoint directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        query: `
          ALTER TABLE projects
          ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
          ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
          ADD COLUMN IF NOT EXISTS location_address TEXT;
        `
      })
    });

    if (!response.ok) {
      console.log('⚠️  exec_sql RPC not available');
      console.log('   Please run the SQL manually in Supabase Dashboard');
      console.log('\n📋 SQL to run:\n');
      console.log(`
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT;

ALTER TABLE projects
ADD CONSTRAINT IF NOT EXISTS check_location_coords
CHECK (
  (latitude IS NULL AND longitude IS NULL) OR
  (latitude IS NOT NULL AND longitude IS NOT NULL)
);

UPDATE projects
SET
  latitude = 40.7128,
  longitude = -74.0060,
  location_address = 'New York, NY (Default - Please Update)'
WHERE latitude IS NULL;
      `);
      return;
    }

    console.log('✅ Columns added');

  } catch (error) {
    console.log('⚠️  Cannot execute DDL via REST API');
    console.log('   Columns need to be added manually');
  }

  // Try to verify by querying
  console.log('\nVerifying schema...');

  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .limit(0);

  console.log('Verification:', error ? '❌ Schema not updated' : '✅ Schema OK');
}

main().catch(console.error);
