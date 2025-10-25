/**
 * Type definitions for autonomous E2E testing system
 */

export type ErrorType =
  | 'build-error'
  | 'database-error'
  | 'runtime-error'
  | 'network-error'
  | 'ui-error'
  | 'timeout-error'
  | 'unknown-error'

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped'

export type TestStepAction = 'navigate' | 'click' | 'type' | 'wait' | 'assert' | 'screenshot'

export interface TestStep {
  action: TestStepAction
  selector?: string
  value?: string
  timeout?: number
  screenshot?: boolean
  description: string
  critical?: boolean
}

export interface FeatureTest {
  id: string
  name: string
  module: string
  prerequisites?: string[]
  steps: TestStep[]
  cleanup?: TestStep[]
  maxDuration?: number
}

export interface TestError {
  message: string
  type: ErrorType
  stack?: string
  selector?: string
  elementFound?: boolean
  screenshot?: string
  consoleErrors?: string[]
  networkErrors?: NetworkError[]
}

export interface NetworkError {
  url: string
  method: string
  status: number
  statusText: string
  body?: string
  timestamp: string
}

export interface TestStepResult {
  step: TestStep
  status: 'passed' | 'failed'
  duration: number
  error?: TestError
  screenshot?: string
  logs?: string[]
}

export interface TestResult {
  testId: string
  name: string
  module: string
  status: TestStatus
  duration: number
  attempts: number
  startTime: string
  endTime?: string
  steps: TestStepResult[]
  screenshots: string[]
  logs: string[]
  agentsDeployed: string[]
  error?: TestError
}

export interface TestRunSummary {
  total: number
  passed: number
  failed: number
  skipped: number
  retried: number
}

export interface TestRunReport {
  runId: string
  startTime: string
  endTime: string
  duration: number
  summary: TestRunSummary
  results: TestResult[]
}

export interface TestConfig {
  chrome: {
    headless: boolean
    devtools: boolean
    viewport: { width: number; height: number }
    slowMo: number
  }
  orchestrator: {
    maxRetries: number
    retryDelay: number
    screenshotOnError: boolean
    pauseOnError: boolean
    continueOnFailure: boolean
  }
  reporting: {
    outputDir: string
    formats: ('html' | 'json' | 'markdown')[]
    saveScreenshots: boolean
    saveLogs: boolean
  }
  features: string[]
}

export interface ConsoleLog {
  level: 'error' | 'warning' | 'info' | 'log'
  message: string
  timestamp: string
  source?: string
  stack?: string
}
