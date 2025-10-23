import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Playwright Global Setup
 * Runs once before all tests
 * Seeds test data into the database
 */
async function globalSetup() {
  console.log('🚀 Running global setup...\n')

  try {
    // Run the seed script using ts-node
    console.log('Seeding test data...')
    const { stdout, stderr } = await execAsync('npx ts-node e2e/setup/seed-test-data.ts', {
      cwd: process.cwd(),
    })

    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)

    console.log('\n✅ Global setup completed!\n')
  } catch (error) {
    console.error('❌ Error in global setup:', error)
    throw error
  }
}

export default globalSetup
