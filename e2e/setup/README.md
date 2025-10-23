# E2E Test Data Setup

This directory contains scripts to seed and clean up test data for E2E tests.

## Prerequisites

### Required Environment Variables

You must have the following environment variable in your `.env.local` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find it:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)

**⚠️ SECURITY WARNING:**
- The service role key bypasses Row Level Security (RLS)
- Never commit this key to version control
- Never expose it to the client-side
- Only use it for server-side operations and testing

## Scripts

### Seed Test Data
Seeds all necessary test data for E2E tests:

```bash
npm run test:e2e:seed
```

**What it creates:**
- ✅ 2 test users (test@example.com, supervisor@example.com)
- ✅ 1 organization (test-org)
- ✅ 1 project (test-project-id)
- ✅ 4 daily reports in various states

### Run E2E Tests
The seeding happens automatically when you run tests:

```bash
npm run test:e2e
```

### Cleanup Test Data
Removes all test data from the database:

```bash
npm run test:e2e:cleanup
```

## Test Data Reference

### Test Users

| Email | Password | Role | User ID |
|-------|----------|------|---------|
| test@example.com | password | Member | `00000000-0000-0000-0000-000000000001` |
| supervisor@example.com | password | Admin/Supervisor | `00000000-0000-0000-0000-000000000002` |

### Organization & Project

| Type | Slug/ID | Name |
|------|---------|------|
| Organization | test-org | Test Organization |
| Project | test-project-id | Test Project |

### Daily Reports

| ID | Status | Date | Description |
|----|--------|------|-------------|
| draft-report-id | draft | Today | Basic draft report |
| submitted-report-id | submitted | Yesterday | Submitted, awaiting approval |
| complete-draft-id | draft | 2 days ago | Complete draft, ready to submit |
| test-report-id | draft | 3 days ago | Generic test report |

## How It Works

### Global Setup
When you run `npm run test:e2e`, Playwright runs the global setup before any tests:

1. Loads environment variables from `.env.local`
2. Creates a Supabase admin client with service role key
3. Seeds all test data using the scripts in this directory
4. Tests run with deterministic, known data

### Global Teardown
After all tests complete, the teardown script runs:
- Currently preserves test data for inspection
- You can manually clean up with `npm run test:e2e:cleanup`

## Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY"
Add the service role key to your `.env.local` file as shown above.

### "User already exists"
The script is idempotent - it checks if data exists before creating. This is expected behavior.

### "Tests can't authenticate"
1. Verify test data was seeded: `npm run test:e2e:seed`
2. Check that users were created in Supabase Dashboard → Authentication → Users
3. Ensure the application is running: `npm run dev`

### "Cannot find test-project-id"
1. Re-seed the data: `npm run test:e2e:cleanup && npm run test:e2e:seed`
2. Check RLS policies aren't blocking test user access
3. Verify project exists in Supabase Dashboard → Table Editor → projects

## Files

- `seed-test-data.ts` - Creates all test data
- `cleanup-test-data.ts` - Removes all test data
- `global-setup.ts` - Playwright global setup (runs before all tests)
- `global-teardown.ts` - Playwright global teardown (runs after all tests)

## Best Practices

1. **Always use deterministic IDs** - Makes tests predictable
2. **Keep test data minimal** - Only create what's needed
3. **Document test data** - Update this README when adding new test data
4. **Clean up between test runs** - Prevents data pollution
5. **Use idempotent scripts** - Should be safe to run multiple times
