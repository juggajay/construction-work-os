/**
 * Error Classifier - Analyzes test failures and routes to appropriate agents
 */

import type { TestError, ErrorType } from './types'

export function classifyError(error: TestError): ErrorType {
  const message = error.message.toLowerCase()

  // Build errors - TypeScript compilation issues
  if (
    message.includes('tsc') ||
    message.includes('type \'') ||
    message.includes('is not assignable') ||
    message.includes('property') && message.includes('does not exist') ||
    message.includes('cannot find name')
  ) {
    return 'build-error'
  }

  // Database errors - SQL, RLS, Supabase
  if (
    message.includes('rls') ||
    message.includes('row-level security') ||
    message.includes('sql') ||
    message.includes('violates') ||
    message.includes('permission denied') ||
    message.includes('foreign key') ||
    message.includes('unique constraint')
  ) {
    return 'database-error'
  }

  // Network errors - API failures
  if (
    error.networkErrors && error.networkErrors.length > 0 ||
    message.includes('network error') ||
    message.includes('fetch failed') ||
    message.includes('api error') ||
    message.includes('status 4') ||
    message.includes('status 5')
  ) {
    return 'network-error'
  }

  // UI errors - Element not found
  if (
    error.selector && !error.elementFound ||
    message.includes('element not found') ||
    message.includes('timeout') && message.includes('selector') ||
    message.includes('waiting for selector')
  ) {
    return 'ui-error'
  }

  // Runtime errors - JavaScript exceptions
  if (
    error.stack ||
    message.includes('cannot read property') ||
    message.includes('undefined') && message.includes('of') ||
    message.includes('is not a function') ||
    message.includes('cannot access') ||
    message.includes('reference error')
  ) {
    return 'runtime-error'
  }

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('exceeded')
  ) {
    return 'timeout-error'
  }

  return 'unknown-error'
}

export function routeToAgent(errorType: ErrorType): string {
  switch (errorType) {
    case 'build-error':
      return '/build-doctor'
    case 'database-error':
      return '/database'
    case 'runtime-error':
    case 'network-error':
      return '/debugger'
    case 'ui-error':
      return '/code-review'
    case 'timeout-error':
      return '/performance'
    default:
      return '/debugger' // Default fallback
  }
}

export function buildErrorContext(error: TestError, testId: string, stepDesc: string): string {
  const agent = routeToAgent(error.type)

  let context = `**Test Failure Detected**\n\n`
  context += `Test: ${testId}\n`
  context += `Step: ${stepDesc}\n`
  context += `Error Type: ${error.type}\n`
  context += `Agent: ${agent}\n\n`

  context += `**Error Message:**\n${error.message}\n\n`

  if (error.stack) {
    context += `**Stack Trace:**\n\`\`\`\n${error.stack}\n\`\`\`\n\n`
  }

  if (error.selector) {
    context += `**Failed Selector:** ${error.selector}\n\n`
  }

  if (error.screenshot) {
    context += `**Screenshot:** ${error.screenshot}\n\n`
  }

  if (error.consoleErrors && error.consoleErrors.length > 0) {
    context += `**Console Errors:**\n`
    error.consoleErrors.slice(0, 5).forEach(log => {
      context += `- ${log}\n`
    })
    context += `\n`
  }

  if (error.networkErrors && error.networkErrors.length > 0) {
    context += `**Network Errors:**\n`
    error.networkErrors.slice(0, 3).forEach(netErr => {
      context += `- ${netErr.method} ${netErr.url} → ${netErr.status} ${netErr.statusText}\n`
    })
    context += `\n`
  }

  context += `**Task:** Fix this error so the test can pass when retried.\n`

  return context
}
