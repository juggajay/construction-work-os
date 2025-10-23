/**
 * Apply Project Location Migration to Production
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('🚀 Applying project location migration to production...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Read the migration file
  const migrationPath = join(__dirname, '../supabase/migrations/20250123000002_add_project_location.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file:', migrationPath);
  console.log('📝 SQL:\n');
  console.log(sql);
  console.log('\n' + '='.repeat(60));
  console.log('Executing migration...\n');

  // Execute the migration (split by semicolon and execute each statement)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));

  for (const statement of statements) {
    if (!statement) continue;

    console.log('Executing:', statement.substring(0, 100) + '...');

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: statement
    }).maybeSingle();

    if (error) {
      // Try direct execution if rpc doesn't exist
      console.log('   RPC not available, migration needs to be run via Supabase Dashboard');
      console.log('\n📋 Copy this SQL and run it in Supabase Dashboard → SQL Editor:\n');
      console.log(sql);
      return;
    }

    console.log('   ✅ Success');
  }

  console.log('\n✅ Migration applied successfully!');

  // Verify
  const { data, error: verifyError } = await supabase
    .from('projects')
    .select('id, name, latitude, longitude')
    .limit(1);

  if (verifyError) {
    console.error('\n❌ Verification failed:', verifyError.message);
  } else {
    console.log('\n✅ Verification passed - location columns exist!');
  }

  // Now set default location for projects
  console.log('\n📍 Setting default location for projects without coordinates...');

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, latitude')
    .is('latitude', null);

  if (projects && projects.length > 0) {
    console.log(`Found ${projects.length} projects without coordinates`);

    for (const project of projects) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          latitude: 40.7128,
          longitude: -74.0060,
          location_address: 'New York, NY (Default - Please Update)'
        })
        .eq('id', project.id);

      if (updateError) {
        console.log(`   ❌ ${project.name}: Failed to update`);
      } else {
        console.log(`   ✅ ${project.name}: Location set`);
      }
    }
  } else {
    console.log('   All projects already have coordinates');
  }

  console.log('\n✨ Complete!');
}

main().catch(console.error);
