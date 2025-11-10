# 🔥 Load Testing Suite

Comprehensive autonomous load testing for Construction Work OS performance validation.

## 📋 Overview

This suite tests the platform under real-world pressure using **three complementary tools**:

1. **k6** - Raw API stress testing (100 concurrent users)
2. **Artillery** - Realistic user workflow scenarios (50 users/sec spike)
3. **Playwright** - Browser-based E2E testing (20 concurrent browsers)

### **What Gets Tested**

- ✅ Database performance under heavy load
- ✅ Batch project health function (96% optimization)
- ✅ N+1 query fixes (RFI, Submittal, Change Order)
- ✅ Dynamic imports and code splitting
- ✅ React.memo re-render optimizations
- ✅ ISR caching behavior
- ✅ Concurrent user handling
- ✅ Mobile performance

### **Performance Targets** (from optimizations)

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Dashboard Load | 8-12s | <1s | **96% faster** |
| Database Queries | 201 | 1 | **99.5% reduction** |
| Bundle Size | ~340KB | ~90KB | **250KB lighter** |
| Error Rate | - | <5% | **Stable** |

---

## 🚀 Quick Start

### **1. Install Dependencies**

```bash
# k6 (choose your platform)
brew install k6                          # macOS
sudo apt-get install k6                  # Ubuntu/Debian
choco install k6                         # Windows

# Artillery
npm install -g artillery

# Playwright
npm install -D @playwright/test
npx playwright install chromium
```

### **2. Configure Environment**

```bash
# Copy example config
cp .env.load-test.example .env.load-test

# Edit with your values
nano .env.load-test
```

**Required values**:
- `BASE_URL` - Your application URL (staging/local)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `TEST_ORG_SLUG` - Test organization slug
- `TEST_ORG_ID` - Test organization UUID
- `TEST_PROJECT_ID` - Test project UUID
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password

### **3. Prepare Test Data**

Create test data in your **staging/local database** (NOT production!):

```sql
-- Create test organization
INSERT INTO organizations (name, slug) VALUES ('Load Test Org', 'loadtest-org');

-- Create 100 test projects
INSERT INTO projects (name, organization_id, status)
SELECT
  'Load Test Project ' || generate_series,
  'your-org-id',
  'active'
FROM generate_series(1, 100);

-- Create 50 test RFIs, Submittals, Change Orders, etc.
-- (Use your existing data or create test fixtures)
```

### **4. Run All Tests (Autonomous)**

```bash
# Run the complete suite (~30 minutes)
./tests/load/run-all-load-tests.sh
```

This will:
1. Verify all dependencies installed
2. Run k6 API stress test (14 minutes)
3. Run Artillery scenario tests (8 minutes)
4. Run Playwright E2E tests (5 minutes)
5. Generate comprehensive performance report
6. Save all results to `tests/load/results/`

---

## 🧪 Running Individual Tests

### **k6 API Stress Test**

Tests raw API performance with 100 concurrent users.

```bash
# Source environment
export $(cat .env.load-test | xargs)

# Run k6 test
k6 run tests/load/k6-api-stress.js

# With custom settings
k6 run --vus 50 --duration 5m tests/load/k6-api-stress.js
```

**What it tests**:
- Batch project health function (<500ms target)
- RFI queries with JOINs
- Submittal detail (4→1 query optimization)
- Change order detail (3→1 query optimization)
- Dashboard load time (<1s target)

**Output**: Console + JSON metrics

---

### **Artillery Scenario Tests**

Tests realistic user workflows and mixed activity.

```bash
# Source environment
export $(cat .env.load-test | xargs)

# Run Artillery test
artillery run tests/load/artillery-scenarios.yml

# Generate HTML report
artillery run --output results.json tests/load/artillery-scenarios.yml
artillery report results.json --output report.html
```

**What it tests**:
- Dashboard → Projects navigation
- RFI creation workflow
- Submittal detail viewing
- Change order management
- Invoice upload (dynamic import)
- Mixed user activity patterns

**Output**: Console + Interactive HTML report

---

### **Playwright E2E Browser Tests**

Tests real browser performance with Web Vitals.

```bash
# Source environment
export $(cat .env.load-test | xargs)

# Run Playwright tests
npx playwright test tests/load/playwright-e2e-load.ts

# With specific workers
npx playwright test tests/load/playwright-e2e-load.ts --workers=20

# Show report
npx playwright show-report
```

**What it tests**:
- Actual page load times
- Dynamic import loading behavior
- React.memo re-render prevention
- Web Vitals (LCP, FCP, TTI)
- Bundle size measurements
- Mobile performance
- 20 concurrent browser users

**Output**: Console + Interactive HTML report

---

## 📊 Understanding Results

### **k6 Metrics**

Look for these in the summary:

```
✅ PASS: http_req_duration p(95) < 1000ms
✅ PASS: batch_health_query_time p(95) < 500ms
✅ PASS: errors < 5%
```

**Key metrics**:
- `http_req_duration` - Request response time
- `http_req_failed` - Failed requests (should be <5%)
- `iterations` - Total test iterations completed
- Custom metrics: `dashboard_load_time`, `batch_health_query_time`

### **Artillery Metrics**

Check the HTML report for:

```
✅ Request rate: 50 req/sec (sustained)
✅ Response time p95: <1000ms
✅ Errors: <5%
```

**Key sections**:
- Latency distribution (p50, p95, p99)
- Codes (HTTP status codes distribution)
- Errors (if any)
- Scenarios (which workflows were tested)

### **Playwright Results**

Review test results and performance logs:

```
✅ Dashboard loaded in 842ms (target: <1000ms)
✅ Submittal API calls: 1 (was 4)
✅ Dynamic import load time: 312ms
✅ LCP: 1.2s (good)
```

**Key checks**:
- All tests passing
- Load times under thresholds
- No console errors
- Web Vitals in "Good" range

---

## 🚨 Troubleshooting

### **"k6: command not found"**

```bash
# Install k6
brew install k6  # macOS
# OR
curl https://github.com/grafana/k6/releases/latest/download/k6-v0.48.0-linux-amd64.tar.gz -L | tar xvz
```

### **"Artillery: command not found"**

```bash
npm install -g artillery
```

### **"Authentication failed" errors**

1. Check `.env.load-test` credentials
2. Verify test user exists in database
3. Confirm Supabase anon key is correct
4. Check RLS policies allow test user access

### **High error rates (>5%)**

1. Check database has capacity for load
2. Verify migrations applied (9 indexes + 2 functions)
3. Check server resources (CPU, memory)
4. Review Supabase logs for errors
5. Reduce concurrent users and retry

### **Performance targets not met**

1. Confirm all 3 migrations applied:
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name IN ('get_batch_project_health', 'refresh_all_materialized_views');
   ```
2. Check indexes created:
   ```sql
   SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%';
   ```
3. Refresh materialized views:
   ```sql
   SELECT refresh_all_materialized_views();
   ```
4. Check database query performance in Supabase dashboard

### **Tests timing out**

1. Increase timeouts in `.env.load-test`
2. Check network connectivity
3. Verify server is responsive
4. Reduce concurrent load

---

## 📁 Test Results Location

All test results saved to: `tests/load/results/`

```
tests/load/results/
├── k6-results-20251110_143022.json
├── k6-summary-20251110_143022.json
├── k6-output-20251110_143022.log
├── artillery-results-20251110_143022.json
├── artillery-report-20251110_143022.html
├── artillery-output-20251110_143022.log
├── playwright-report-20251110_143022/
│   └── index.html
├── playwright-output-20251110_143022.log
└── LOAD_TEST_REPORT_20251110_143022.md
```

**Key files**:
- `artillery-report-*.html` - Interactive Artillery report (open in browser)
- `playwright-report-*/index.html` - Interactive Playwright report (open in browser)
- `LOAD_TEST_REPORT_*.md` - Comprehensive summary report

---

## ⚙️ Customizing Tests

### **Change Load Levels**

Edit `tests/load/k6-api-stress.js`:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Change to 20 for heavier load
    { duration: '2m', target: 50 },   // Change to 100
    // ...
  ],
};
```

Edit `tests/load/artillery-scenarios.yml`:

```yaml
phases:
  - duration: 60
    arrivalRate: 10  # Change to 20 for heavier load
```

### **Add New Scenarios**

Add to `tests/load/artillery-scenarios.yml`:

```yaml
scenarios:
  - name: "My Custom Scenario"
    weight: 15
    flow:
      - get:
          url: "/{{ orgSlug }}/custom-page"
      - think: 2
```

### **Add New E2E Tests**

Add to `tests/load/playwright-e2e-load.ts`:

```typescript
test.describe('My Custom Module', () => {
  test('should do something', async () => {
    // Your test code
  });
});
```

---

## 🎯 Success Criteria

Your app is ready for production when:

- ✅ **k6 tests pass** with <5% error rate
- ✅ **Dashboard loads in <1s** with 100 projects
- ✅ **Batch health query <500ms**
- ✅ **All Playwright tests pass**
- ✅ **Artillery p95 <1000ms**
- ✅ **No database lock contention**
- ✅ **Web Vitals in "Good" range**

---

## 📞 Support

If tests fail or you need help:

1. Check troubleshooting section above
2. Review `BATTLE_TEST_REPORT.md` for optimization details
3. Check Supabase logs for database errors
4. Review `AUTONOMOUS_OPTIMIZATION_MISSION_COMPLETE.md` for implementation details

---

## 🔐 Security Notes

- **NEVER run load tests against production database**
- Use staging environment or local dev
- Test data should be fake/generated
- Keep `.env.load-test` out of git (already in .gitignore)
- Use dedicated test user with limited permissions
- Review RLS policies before testing

---

**Created**: November 10, 2025
**Optimizations**: Phase 1 (DB) + Phase 2 (Caching) + Phase 3 (React)
**Target**: 96% faster, 99.5% fewer queries, 250KB lighter
