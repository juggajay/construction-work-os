require('dotenv').config({ path: '.env.local' });
const { readFileSync } = require('fs');
const https = require('https');

const accessToken = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2';
const projectRef = 'tokjmeqjvexnmtampyjm';

if (!accessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not found');
  process.exit(1);
}

console.log('🔗 Using Supabase Management API');
console.log('   Project:', projectRef);

async function executeSqlViaApi(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: responseData });
        } else {
          resolve({ success: false, error: responseData, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function applyMigration(filePath, migrationName) {
  console.log(`\n📄 Applying migration: ${migrationName}...`);

  try {
    const sql = readFileSync(filePath, 'utf8');

    const result = await executeSqlViaApi(sql);

    if (result.success) {
      console.log(`✅ Migration ${migrationName} completed successfully`);
      return true;
    } else {
      console.error(`❌ Migration ${migrationName} failed:`);
      console.error('   Status:', result.status);
      console.error('   Error:', result.error.substring(0, 200));
      return false;
    }
  } catch (err) {
    console.error(`❌ Error applying ${migrationName}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Starting migration process via Management API...\n');

  const migrations = [
    {
      file: 'supabase/migrations/20251025025919_fix_change_order_numbering_case_type_mismatch.sql',
      name: 'fix_change_order_numbering_case_type_mismatch'
    },
    {
      file: 'supabase/migrations/20251025030803_fix_daily_reports_user_foreign_keys.sql',
      name: 'fix_daily_reports_user_foreign_keys'
    }
  ];

  let success = 0;
  let failed = 0;

  for (const migration of migrations) {
    const result = await applyMigration(migration.file, migration.name);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  console.log('\n📊 Results:');
  console.log(`   ✅ Successful: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('\n✅ Migration process complete!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
