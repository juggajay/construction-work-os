const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'tokjmeqjvexnmtampyjm';
const ACCESS_TOKEN = 'sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2';

const sql = fs.readFileSync('fix-rls-policies.sql', 'utf8');

const data = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Applying RLS policy fixes to remote database...\n');

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', body);

    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✓ RLS policies fixed successfully!');
    } else {
      console.log('\n✗ Failed to apply fixes');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
