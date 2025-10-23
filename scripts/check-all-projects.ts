/**
 * Check All Projects (including deleted)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_ORG_SLUG = 'ryox-carpentry';

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', TEST_ORG_SLUG)
    .single();

  if (!org) {
    console.error('Org not found');
    return;
  }

  console.log(`Organization: ${org.name} (${org.id})\n`);

  // Get ALL projects (including deleted)
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', org.id);

  console.log(`Total projects: ${projects?.length || 0}`);

  if (projects) {
    projects.forEach(p => {
      console.log(`\n📁 ${p.name}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Deleted: ${p.deleted_at ? '❌ YES' : '✅ NO'}`);
      console.log(`   Location: ${p.latitude}, ${p.longitude}`);
      console.log(`   Status: ${p.status}`);
    });
  }
}

main().catch(console.error);
