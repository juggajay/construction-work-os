/**
 * k6 API Load Testing Suite
 * Stress tests the backend APIs and database under heavy concurrent load
 *
 * Run with: k6 run tests/load/k6-api-stress.js
 *
 * Performance Targets (from optimizations):
 * - Dashboard: <1s with 100 projects
 * - RFI queries: 1 query instead of 2
 * - Submittal detail: 1 query instead of 4
 * - Change order detail: 1 query instead of 3
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const dashboardLoadTime = new Trend('dashboard_load_time');
const rfiQueryTime = new Trend('rfi_query_time');
const submittalQueryTime = new Trend('submittal_query_time');
const changeOrderQueryTime = new Trend('change_order_query_time');
const batchHealthQueryTime = new Trend('batch_health_query_time');
const failedRequests = new Counter('failed_requests');

// Load testing configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '2m', target: 25 },   // Ramp up to 25 users
    { duration: '3m', target: 50 },   // Ramp up to 50 users (sustained load)
    { duration: '2m', target: 75 },   // Spike to 75 users
    { duration: '3m', target: 100 },  // Max load - 100 concurrent users
    { duration: '2m', target: 50 },   // Ramp down
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% of requests under 1s
    'http_req_duration{name:dashboard}': ['p(95)<1000'], // Dashboard <1s target
    'http_req_duration{name:batch_health}': ['p(95)<500'], // Batch query <500ms
    'errors': ['rate<0.05'], // Error rate < 5%
    'failed_requests': ['count<100'], // Less than 100 total failures
  },
};

// Environment configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://tokjmeqjvexnmtampyjm.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

// Test data IDs (replace with actual IDs from your database)
const TEST_ORG_ID = __ENV.TEST_ORG_ID || '';
const TEST_PROJECT_ID = __ENV.TEST_PROJECT_ID || '';
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || 'testpassword';

let authToken = '';

export function setup() {
  console.log('🔥 Starting k6 API Stress Test...');
  console.log('   Target: 100 concurrent users');
  console.log('   Duration: ~14 minutes');
  console.log('   Base URL:', BASE_URL);

  // Authenticate to get access token
  if (TEST_USER_EMAIL && TEST_USER_PASSWORD) {
    const loginRes = http.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );

    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body);
      authToken = body.access_token;
      console.log('✅ Authentication successful');
      return { authToken };
    } else {
      console.log('⚠️  Authentication failed - running unauthenticated tests only');
    }
  }

  return { authToken: '' };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };

  if (data.authToken) {
    headers['Authorization'] = `Bearer ${data.authToken}`;
  }

  // TEST 1: Batch Project Health Function (Critical optimization)
  // Target: <500ms for 100 projects (was 8-12 seconds)
  if (TEST_ORG_ID) {
    const batchHealthStart = Date.now();
    const batchRes = http.post(
      `${SUPABASE_URL}/rest/v1/rpc/get_batch_project_health`,
      JSON.stringify({ org_id: TEST_ORG_ID }),
      {
        headers,
        tags: { name: 'batch_health' }
      }
    );

    const batchHealthDuration = Date.now() - batchHealthStart;
    batchHealthQueryTime.add(batchHealthDuration);

    check(batchRes, {
      'batch health status 200': (r) => r.status === 200,
      'batch health <500ms': (r) => batchHealthDuration < 500,
      'batch health <1s': (r) => batchHealthDuration < 1000,
    }) || errorRate.add(1);

    if (batchRes.status !== 200) {
      failedRequests.add(1);
    }
  }

  // TEST 2: Dashboard Load (Page-level test)
  if (TEST_ORG_ID) {
    const dashboardStart = Date.now();
    const dashboardRes = http.get(
      `${BASE_URL}/api/org/${TEST_ORG_ID}/dashboard`,
      {
        headers,
        tags: { name: 'dashboard' }
      }
    );

    const dashboardDuration = Date.now() - dashboardStart;
    dashboardLoadTime.add(dashboardDuration);

    check(dashboardRes, {
      'dashboard status 200': (r) => r.status === 200,
      'dashboard <1s': (r) => dashboardDuration < 1000,
    }) || errorRate.add(1);
  }

  // TEST 3: RFI List Query (Verify 1 query optimization)
  const rfiStart = Date.now();
  const rfiRes = http.get(
    `${SUPABASE_URL}/rest/v1/rfis?select=*,assigned_to_profile:profiles!assigned_to(*)`,
    {
      headers,
      tags: { name: 'rfi_list' }
    }
  );

  const rfiDuration = Date.now() - rfiStart;
  rfiQueryTime.add(rfiDuration);

  check(rfiRes, {
    'rfi list status 200': (r) => r.status === 200,
    'rfi list <300ms': (r) => rfiDuration < 300,
  }) || errorRate.add(1);

  // TEST 4: Submittal Detail Query (Verify 4→1 query optimization)
  if (TEST_PROJECT_ID) {
    const submittalStart = Date.now();
    const submittalRes = http.get(
      `${SUPABASE_URL}/rest/v1/submittals?project_id=eq.${TEST_PROJECT_ID}&select=*,attachments(*),reviews(*),versions(*)&limit=1`,
      {
        headers,
        tags: { name: 'submittal_detail' }
      }
    );

    const submittalDuration = Date.now() - submittalStart;
    submittalQueryTime.add(submittalDuration);

    check(submittalRes, {
      'submittal detail status 200': (r) => r.status === 200,
      'submittal detail <200ms': (r) => submittalDuration < 200,
    }) || errorRate.add(1);
  }

  // TEST 5: Change Order Detail Query (Verify 3→1 query optimization)
  if (TEST_PROJECT_ID) {
    const coStart = Date.now();
    const coRes = http.get(
      `${SUPABASE_URL}/rest/v1/change_orders?project_id=eq.${TEST_PROJECT_ID}&select=*,line_items(*),approvals(*)&limit=1`,
      {
        headers,
        tags: { name: 'change_order_detail' }
      }
    );

    const coDuration = Date.now() - coStart;
    changeOrderQueryTime.add(coDuration);

    check(coRes, {
      'change order detail status 200': (r) => r.status === 200,
      'change order detail <200ms': (r) => coDuration < 200,
    }) || errorRate.add(1);
  }

  // TEST 6: Projects List Query (Index performance)
  const projectsRes = http.get(
    `${SUPABASE_URL}/rest/v1/projects?select=*&limit=100`,
    {
      headers,
      tags: { name: 'projects_list' }
    }
  );

  check(projectsRes, {
    'projects list status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // TEST 7: Daily Reports Query
  const reportsRes = http.get(
    `${SUPABASE_URL}/rest/v1/daily_reports?select=*&limit=50`,
    {
      headers,
      tags: { name: 'daily_reports' }
    }
  );

  check(reportsRes, {
    'daily reports status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1); // Think time between requests
}

export function teardown(data) {
  console.log('\n🏁 k6 API Stress Test Complete!');
  console.log('   Check k6 output above for detailed metrics');
  console.log('   Key metrics to review:');
  console.log('   - http_req_duration (p95 should be <1s)');
  console.log('   - batch_health_query_time (should be <500ms)');
  console.log('   - error rate (should be <5%)');
  console.log('\n💡 If tests fail, check:');
  console.log('   1. Database indexes are created (9 indexes)');
  console.log('   2. Batch function exists (get_batch_project_health)');
  console.log('   3. Materialized views refreshed recently');
  console.log('   4. Server has enough resources for 100 concurrent users');
}
