require('dotenv').config({ path: '.env.local' });

const accessToken = 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2';
const projectRef = 'tokjmeqjvexnmtampyjm';

async function checkTable(tableName) {
  const sql = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}' ORDER BY ordinal_position;`;

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const data = await response.json();
  return data;
}

async function main() {
  console.log('🔍 Checking budget quote tables...\n');

  const tables = ['project_quotes', 'budget_line_items'];

  for (const table of tables) {
    console.log(`📋 Table: ${table}`);
    const result = await checkTable(table);

    if (result.error) {
      console.log('   ❌ Error:', result.error);
    } else if (result.length === 0) {
      console.log('   ❌ Table does not exist');
    } else {
      console.log(`   ✅ Table exists with ${result.length} columns`);
      result.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type}`);
      });
    }
    console.log('');
  }
}

main().catch(console.error);
