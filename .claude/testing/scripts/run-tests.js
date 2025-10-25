/**
 * Run Autonomous E2E Tests (JavaScript version)
 */

const { runTestOrchestrator } = require('../../../lib/testing/orchestrator')
const config = require('../config.json')

async function main() {
  console.log('🚀 Starting Autonomous E2E Tests\n')

  try {
    const report = await runTestOrchestrator(config)

    console.log('\n✨ Tests Complete!')
    console.log(`View HTML report: ${config.reporting.outputDir}/${report.runId}.html`)

    // Exit with error code if any tests failed
    if (report.summary.failed > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Test run failed:', error)
    process.exit(1)
  }
}

main()
