/**
 * Playwright Global Teardown
 * Runs once after all tests complete
 *
 * Note: We don't clean up test data here because:
 * 1. The test data is deterministic and can be re-seeded
 * 2. Keeping data allows for manual inspection after tests
 * 3. Production database should have separate test/prod environments
 *
 * If you want to clean up test data, you can run the cleanup script manually:
 * npm run test:e2e:cleanup
 */
async function globalTeardown() {
  console.log('\n🧹 Running global teardown...')
  console.log('Test data preserved for inspection.')
  console.log('To clean up test data, run: npm run test:e2e:cleanup')
}

export default globalTeardown
