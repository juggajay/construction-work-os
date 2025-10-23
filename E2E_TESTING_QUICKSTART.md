# E2E Testing Quick Start Guide

## 🚀 Getting Started

### Step 1: Get Your Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `tokjmeqjvexnmtampyjm`
3. Navigate to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)

### Step 2: Add to .env.local

Open your `.env.local` file and add the service role key:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

⚠️ **Important:** Uncomment this line and replace with your actual key.

### Step 3: Run Tests

```bash
# This will automatically:
# 1. Seed test data (via global setup)
# 2. Run all E2E tests
# 3. Generate HTML report
npm run test:e2e
```

## 📊 What Gets Created

### Test Users
- **Regular User:**
  - Email: `test@example.com`
  - Password: `password`
  - Role: Member

- **Supervisor:**
  - Email: `supervisor@example.com`
  - Password: `password`
  - Role: Admin/Supervisor

### Test Organization & Project
- **Organization:** `test-org` (Test Organization)
- **Project:** `test-project-id` (Test Project)

### Daily Reports
1. **Draft Report** (`draft-report-id`) - Basic draft
2. **Submitted Report** (`submitted-report-id`) - Awaiting approval
3. **Complete Draft** (`complete-draft-id`) - Ready to submit
4. **Test Report** (`test-report-id`) - Generic test report

## 🧪 Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests with UI
```bash
npm run test:e2e:ui
```

### Run Specific Test File
```bash
npx playwright test e2e/daily-reports.spec.ts
```

### Run Tests in Debug Mode
```bash
npx playwright test --debug
```

## 🔧 Manual Data Management

### Seed Test Data Only
If you want to seed data without running tests:

```bash
npm run test:e2e:seed
```

### Clean Up Test Data
Remove all test data from the database:

```bash
npm run test:e2e:cleanup
```

### Re-seed Fresh Data
```bash
npm run test:e2e:cleanup && npm run test:e2e:seed
```

## 📁 Test Structure

```
e2e/
├── auth.spec.ts                    # Authentication tests (passing)
├── navigation.spec.ts              # Navigation tests (passing)
├── daily-reports.spec.ts           # Daily reports tests (14 tests)
├── organization-project-flow.spec.ts
├── complete-workflow.spec.ts
└── setup/
    ├── seed-test-data.ts          # Seeds all test data
    ├── cleanup-test-data.ts       # Removes all test data
    ├── global-setup.ts            # Runs before all tests
    ├── global-teardown.ts         # Runs after all tests
    └── README.md                  # Detailed documentation
```

## ✅ Expected Results

After running `npm run test:e2e`, you should see:

```
Running 14 tests using 1 worker

✓ [chromium] › daily-reports.spec.ts:13:3 › user can view daily reports list
✓ [chromium] › daily-reports.spec.ts:30:3 › user can create a new daily report
✓ [chromium] › daily-reports.spec.ts:71:3 › user can filter daily reports by status
✓ [chromium] › daily-reports.spec.ts:89:3 › user can view daily report details
✓ [chromium] › daily-reports.spec.ts:112:3 › user can edit a draft daily report
✓ [chromium] › daily-reports.spec.ts:136:3 › user cannot edit a submitted daily report
✓ [chromium] › daily-reports.spec.ts:147:3 › user can add crew entries to daily report
✓ [chromium] › daily-reports.spec.ts:171:3 › user can upload photos to daily report
✓ [chromium] › daily-reports.spec.ts:201:3 › user can submit a daily report
✓ [chromium] › daily-reports.spec.ts:229:3 › supervisor can approve a submitted daily report
✓ [chromium] › daily-reports.spec.ts:252:3 › user can export daily report to PDF
✓ [chromium] › daily-reports.spec.ts:267:3 › user can copy entries from previous report
✓ [chromium] › daily-reports.spec.ts:284:3 › validation prevents submission of incomplete report
✓ [chromium] › daily-reports.spec.ts:304:3 › user can delete crew entry from draft report

14 passed (45s)
```

## 🔍 Troubleshooting

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"
**Solution:** Add the service role key to your `.env.local` file as described in Step 2 above.

### Error: "User already exists"
**Solution:** This is normal! The seed script is idempotent. It checks if data exists before creating.

### Error: "Cannot authenticate test user"
**Solutions:**
1. Verify test data was seeded: `npm run test:e2e:seed`
2. Check users exist in Supabase Dashboard → Authentication → Users
3. Ensure dev server is running: `npm run dev`

### Error: "Project not found"
**Solutions:**
1. Re-seed the database: `npm run test:e2e:cleanup && npm run test:e2e:seed`
2. Check RLS policies aren't blocking access
3. Verify in Supabase Dashboard → Table Editor → projects

### Tests are slow or timing out
**Solutions:**
1. Increase timeout in `playwright.config.ts`
2. Run tests serially: `npx playwright test --workers=1`
3. Check your internet connection (if using Supabase Cloud)

## 📚 Additional Resources

- **Detailed Setup Documentation:** `/e2e/setup/README.md`
- **Playwright Documentation:** https://playwright.dev
- **Supabase Auth Admin API:** https://supabase.com/docs/reference/javascript/auth-admin-api

## 🔐 Security Notes

1. **Never commit** the service role key to version control
2. **Never expose** the service role key to the client-side
3. The service role key **bypasses all RLS policies** - use carefully
4. Consider using separate Supabase projects for testing and production

## 🎯 Next Steps

1. ✅ Add service role key to `.env.local`
2. ✅ Run `npm run test:e2e:seed` to verify seeding works
3. ✅ Run `npm run test:e2e` to execute all tests
4. ✅ View HTML report: `npx playwright show-report`
5. ✅ Write additional test cases as needed

Happy testing! 🧪
