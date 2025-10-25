const fs = require('fs');
const https = require('https');

const API_URL = 'api.supabase.com';
const PROJECT_REF = 'tokjmeqjvexnmtampyjm';
const ACCESS_TOKEN = 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2';

const MIGRATIONS = [
  'supabase/migrations/20250125000000_create_change_order_enums.sql',
  'supabase/migrations/20250125000001_create_change_orders_table.sql',
  'supabase/migrations/20250125000002_create_change_order_line_items_table.sql',
  'supabase/migrations/20250125000003_create_change_order_approvals_table.sql',
  'supabase/migrations/20250125000004_create_change_order_versions_table.sql',
  'supabase/migrations/20250125000005_create_change_order_attachments_table.sql',
  'supabase/migrations/20250125000006_create_co_numbering_functions.sql',
  'supabase/migrations/20250125000007_create_change_order_rls_policies.sql',
  'supabase/migrations/20250125000008_create_change_order_audit_triggers.sql',
  'supabase/migrations/20250125000009_add_cumulative_contract_value_to_projects.sql',
  'supabase/migrations/20250125000010_create_storage_bucket_change_orders.sql',
];

function executeQuery(query) {
  return new Promise((resolve, reject) => {
    // JSON.stringify handles all escaping automatically
    const payload = { query: query };
    const data = JSON.stringify(payload);

    const options = {
      hostname: API_URL,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        } else {
          resolve(body);
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

async function applyMigrations() {
  console.log('🚀 Starting migration deployment...\n');

  // Start from migration 11 (index 10) since first 10 are already applied
  for (let i = 10; i < MIGRATIONS.length; i++) {
    const migration = MIGRATIONS[i];
    const migrationNum = i + 1;

    console.log(`📄 [${migrationNum}/11] Applying: ${migration}`);

    try {
      const sql = fs.readFileSync(migration, 'utf8');
      const response = await executeQuery(sql);

      console.log(`✅ Success\n`);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}\n`);
      process.exit(1);
    }
  }

  console.log('🎉 All 11 migrations applied successfully!');
}

applyMigrations();
