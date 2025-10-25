/**
 * Test Orchestrator - Core logic for running autonomous E2E tests
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { ChromeClient } from './chrome-client'
import { classifyError, routeToAgent, buildErrorContext } from './error-classifier'
import type {
  TestConfig,
  FeatureTest,
  TestResult,
  TestRunReport,
  TestStatus,
  TestError,
  TestStepResult,
} from './types'

export class TestOrchestrator {
  private client: ChromeClient
  private config: TestConfig
  private results: TestResult[] = []
  private startTime: string = ''

  constructor(config: TestConfig) {
    this.config = config
    this.client = new ChromeClient()
  }

  async run(): Promise<TestRunReport> {
    this.startTime = new Date().toISOString()

    console.log('🤖 Autonomous Test Orchestrator Starting...\n')

    try {
      // Connect to Chrome
      await this.client.connect(
        this.config.chrome.headless,
        this.config.chrome.devtools,
        this.config.chrome.slowMo
      )

      // Wait 3 seconds for user to see Chrome opened
      console.log('⏸️  Chrome opened - waiting 3 seconds before starting tests...\n')
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Load test suite
      const tests = await this.loadTestSuite()
      console.log(`✓ Loaded ${tests.length} tests\n`)

      // Execute tests sequentially
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i]!
        console.log(`\n[$${i + 1}/${tests.length}] Running test: ${test.name}`)

        const result = await this.runTest(test, i + 1, tests.length)
        this.results.push(result)

        // Log result
        if (result.status === 'passed') {
          console.log(`✓ PASSED: ${test.name} (${result.duration}ms)`)
        } else if (result.status === 'failed') {
          console.log(`✗ FAILED: ${test.name} (${result.attempts} attempts)`)
        } else {
          console.log(`⊘ SKIPPED: ${test.name}`)
        }
      }

      // Generate report
      const report = this.generateReport()

      // Save reports
      await this.saveReports(report)

      console.log(`\n📊 Test Run Complete!`)
      console.log(`Passed: ${report.summary.passed}/${report.summary.total}`)
      console.log(`Failed: ${report.summary.failed}/${report.summary.total}`)
      console.log(`Retried: ${report.summary.retried}`)

      // Keep Chrome open for 30 seconds so user can see the results
      console.log(`\n⏸️  Keeping Chrome open for 30 seconds so you can see the final state...`)
      await new Promise(resolve => setTimeout(resolve, 30000))

      return report
    } finally {
      await this.client.disconnect()
    }
  }

  private async loadTestSuite(): Promise<FeatureTest[]> {
    const testsDir = path.join(process.cwd(), '.claude/testing/features')
    const files = await fs.readdir(testsDir)
    const jsonFiles = files.filter((f) => f.endsWith('.json'))

    const tests: FeatureTest[] = []
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(testsDir, file), 'utf-8')
      const test = JSON.parse(content) as FeatureTest
      tests.push(test)
    }

    return tests
  }

  private async runTest(
    test: FeatureTest,
    testNum: number,
    totalTests: number
  ): Promise<TestResult> {
    const result: TestResult = {
      testId: test.id,
      name: test.name,
      module: test.module,
      status: 'running',
      duration: 0,
      attempts: 0,
      startTime: new Date().toISOString(),
      steps: [],
      screenshots: [],
      logs: [],
      agentsDeployed: [],
    }

    const startTime = Date.now()

    // Run with retries
    for (let attempt = 1; attempt <= this.config.orchestrator.maxRetries + 1; attempt++) {
      result.attempts = attempt

      try {
        // Clear logs from previous attempt
        this.client.clearLogs()

        // Execute test steps
        for (let i = 0; i < test.steps.length; i++) {
          const step = test.steps[i]!

          // Update overlay
          await this.client.updateOverlay(
            `${test.name} (${testNum}/${totalTests})`,
            `${step.description} (${i + 1}/${test.steps.length})`,
            `✓ Running`,
            attempt - 1
          )

          const stepResult = await this.executeStep(step, test.id)
          result.steps.push(stepResult)

          if (stepResult.status === 'failed') {
            // Step failed
            if (step.critical) {
              throw new Error(`Critical step failed: ${step.description}`)
            }
          }
        }

        // All steps passed
        result.status = 'passed'
        result.endTime = new Date().toISOString()
        result.duration = Date.now() - startTime
        result.logs = this.client.getConsoleLogs().map((l) => l.message)
        return result

      } catch (error) {
        // Test failed
        const testError = this.buildTestError(error, test)
        result.error = testError

        if (this.config.orchestrator.screenshotOnError) {
          const screenshotPath = path.join(
            this.config.reporting.outputDir,
            'screenshots',
            `${test.id}-error-attempt-${attempt}.png`
          )
          await this.client.screenshot(screenshotPath)
          result.screenshots.push(screenshotPath)
        }

        // Should we retry?
        if (attempt <= this.config.orchestrator.maxRetries) {
          // Deploy agent to fix
          const agent = await this.deployAgent(testError, test, attempt)
          if (agent) {
            result.agentsDeployed.push(agent)
          }

          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.orchestrator.retryDelay)
          )

          console.log(`  ↻ Retrying (attempt ${attempt + 1}/${this.config.orchestrator.maxRetries + 1})`)
        } else {
          // Max retries exceeded
          result.status = 'failed'
          result.endTime = new Date().toISOString()
          result.duration = Date.now() - startTime
          result.logs = this.client.getConsoleLogs().map((l) => l.message)
          return result
        }
      }
    }

    // Should not reach here, but just in case
    result.status = 'failed'
    result.endTime = new Date().toISOString()
    result.duration = Date.now() - startTime
    return result
  }

  private async executeStep(
    step: any,
    testId: string
  ): Promise<TestStepResult> {
    const stepStartTime = Date.now()

    try {
      switch (step.action) {
        case 'navigate':
          await this.client.navigate(step.value!, step.timeout)
          break

        case 'click':
          await this.client.click(step.selector!, step.timeout)
          break

        case 'type':
          await this.client.type(step.selector!, step.value!, step.timeout)
          break

        case 'wait':
          await this.client.wait(parseInt(step.value!) || 1000)
          break

        case 'assert':
          const exists = await this.client.assertElementExists(
            step.selector!,
            step.timeout
          )
          if (!exists) {
            throw new Error(`Assertion failed: element not found - ${step.selector}`)
          }
          break

        case 'screenshot':
          const screenshotPath = path.join(
            this.config.reporting.outputDir,
            'screenshots',
            `${testId}-${step.description.replace(/\s+/g, '-')}.png`
          )
          await this.client.screenshot(screenshotPath)
          break
      }

      return {
        step,
        status: 'passed',
        duration: Date.now() - stepStartTime,
      }
    } catch (error) {
      return {
        step,
        status: 'failed',
        duration: Date.now() - stepStartTime,
        error: this.buildTestError(error, { id: testId } as any),
      }
    }
  }

  private buildTestError(error: any, test: FeatureTest): TestError {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    const testError: TestError = {
      message: errorMessage,
      type: 'unknown-error', // Will be classified
      stack: errorStack,
      consoleErrors: this.client.getConsoleLogs()
        .filter(l => l.level === 'error')
        .map(l => l.message),
      networkErrors: this.client.getNetworkErrors(),
    }

    // Classify error
    testError.type = classifyError(testError)

    return testError
  }

  private async deployAgent(
    error: TestError,
    test: FeatureTest,
    attempt: number
  ): Promise<string | null> {
    const agent = routeToAgent(error.type)
    const context = buildErrorContext(error, test.id, test.name)

    console.log(`  🔧 Deploying ${agent} to fix ${error.type}`)
    console.log(`     Error: ${error.message.substring(0, 100)}...`)

    // Note: In a real implementation, we would use the SlashCommand tool here
    // For now, we'll just log that we would deploy the agent
    console.log(`     [Would deploy ${agent} with context]`)

    return agent
  }

  private generateReport(): TestRunReport {
    const endTime = new Date().toISOString()
    const duration = new Date(endTime).getTime() - new Date(this.startTime).getTime()

    const summary = {
      total: this.results.length,
      passed: this.results.filter((r) => r.status === 'passed').length,
      failed: this.results.filter((r) => r.status === 'failed').length,
      skipped: this.results.filter((r) => r.status === 'skipped').length,
      retried: this.results.filter((r) => r.attempts > 1).length,
    }

    return {
      runId: `test-run-${Date.now()}`,
      startTime: this.startTime,
      endTime,
      duration,
      summary,
      results: this.results,
    }
  }

  private async saveReports(report: TestRunReport): Promise<void> {
    const outputDir = this.config.reporting.outputDir

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true })

    // Save JSON report
    if (this.config.reporting.formats.includes('json')) {
      const jsonPath = path.join(outputDir, `${report.runId}.json`)
      await fs.writeFile(jsonPath, JSON.stringify(report, null, 2))
      console.log(`\n📄 JSON Report: ${jsonPath}`)
    }

    // Save HTML report
    if (this.config.reporting.formats.includes('html')) {
      const htmlPath = path.join(outputDir, `${report.runId}.html`)
      const html = this.generateHtmlReport(report)
      await fs.writeFile(htmlPath, html)
      console.log(`📄 HTML Report: ${htmlPath}`)
    }
  }

  private generateHtmlReport(report: TestRunReport): string {
    const passRate = ((report.summary.passed / report.summary.total) * 100).toFixed(1)

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report - ${report.runId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-bottom: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .summary-card { padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card.total { background: #e3f2fd; }
    .summary-card.passed { background: #e8f5e9; }
    .summary-card.failed { background: #ffebee; }
    .summary-card.retried { background: #fff3e0; }
    .summary-card h3 { margin: 0; font-size: 14px; color: #666; text-transform: uppercase; }
    .summary-card .value { font-size: 36px; font-weight: bold; margin: 10px 0; }
    .test-result { margin-bottom: 20px; padding: 15px; border-radius: 4px; border-left: 4px solid #ddd; }
    .test-result.passed { border-left-color: #4caf50; background: #f1f8f4; }
    .test-result.failed { border-left-color: #f44336; background: #fef5f5; }
    .test-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
    .test-meta { font-size: 13px; color: #666; }
    .error { background: #fff3e0; padding: 10px; margin-top: 10px; border-radius: 4px; font-size: 13px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 Autonomous Test Report</h1>

    <div class="summary">
      <div class="summary-card total">
        <h3>Total Tests</h3>
        <div class="value">${report.summary.total}</div>
      </div>
      <div class="summary-card passed">
        <h3>Passed</h3>
        <div class="value">${report.summary.passed}</div>
        <div>${passRate}%</div>
      </div>
      <div class="summary-card failed">
        <h3>Failed</h3>
        <div class="value">${report.summary.failed}</div>
      </div>
      <div class="summary-card retried">
        <h3>Retried</h3>
        <div class="value">${report.summary.retried}</div>
      </div>
    </div>

    <h2>Test Results</h2>
    ${report.results
      .map(
        (result) => `
      <div class="test-result ${result.status}">
        <div class="test-name">${result.status === 'passed' ? '✓' : '✗'} ${result.name}</div>
        <div class="test-meta">
          Duration: ${result.duration}ms |
          Attempts: ${result.attempts} |
          Module: ${result.module}
          ${result.agentsDeployed.length > 0 ? ` | Agents: ${result.agentsDeployed.join(', ')}` : ''}
        </div>
        ${
          result.error
            ? `<div class="error"><strong>Error:</strong> ${result.error.message}</div>`
            : ''
        }
      </div>
    `
      )
      .join('')}
  </div>
</body>
</html>
    `
  }
}

export async function runTestOrchestrator(config: TestConfig): Promise<TestRunReport> {
  const orchestrator = new TestOrchestrator(config)
  return await orchestrator.run()
}
