require('dotenv').config({ path: '.env.local' });

const accessToken = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2';
const projectRef = 'tokjmeqjvexnmtampyjm';

async function executeSqlViaApi(sql) {
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    const data = await response.text();

    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data, status: response.status };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🔄 Refreshing project_cost_summary materialized view...\n');

  const result = await executeSqlViaApi('REFRESH MATERIALIZED VIEW CONCURRENTLY project_cost_summary;');

  if (result.success) {
    console.log('✅ Materialized view refreshed successfully');
  } else {
    console.error('❌ Failed to refresh materialized view:');
    console.error('   Status:', result.status);
    console.error('   Error:', result.error);
  }
}

main();
