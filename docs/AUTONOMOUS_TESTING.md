# Autonomous End-to-End Testing System

## Overview

The Autonomous E2E Testing System is a comprehensive testing framework that systematically tests all application features, automatically fixes errors using specialist AI agents, and provides real-time visual feedback in Chrome.

## Features

- 🤖 **Fully Autonomous** - Tests run without manual intervention
- 🔧 **Self-Healing** - Automatically deploys agents to fix errors
- 👀 **Visual Feedback** - See tests running in real-time in Chrome
- 🔄 **Smart Retries** - Up to 3 retry attempts with exponential backoff
- 📊 **Rich Reports** - HTML and JSON reports with screenshots and logs
- 🎯 **Agent Routing** - Routes errors to specialized agents (/debugger, /database, /build-doctor, etc.)

## Quick Start

### 1. Install Dependencies

Dependencies are already installed (puppeteer-core, chrome-launcher, ws).

### 2. Start Your Application

Make sure your Next.js application is running:

```bash
npm run dev
```

### 3. Run Tests

Use the Claude Code slash command:

```
/test:orchestrate
```

This will:
1. Launch Chrome browser
2. Load test suite from `.claude/testing/features/`
3. Execute tests sequentially
4. Fix errors automatically with agents
5. Generate HTML and JSON reports

## Configuration

Edit `.claude/testing/config.json` to customize:

```json
{
  "chrome": {
    "headless": false,        // Set to true to hide browser
    "devtools": true,          // Open DevTools automatically
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "slowMo": 100             // Delay between actions (ms)
  },
  "orchestrator": {
    "maxRetries": 3,           // Max retry attempts per test
    "retryDelay": 5000,        // Delay between retries (ms)
    "screenshotOnError": true, // Capture screenshots on errors
    "pauseOnError": false,     // Pause execution on errors
    "continueOnFailure": true  // Continue to next test after failure
  },
  "reporting": {
    "outputDir": "./test-results",
    "formats": ["html", "json"],
    "saveScreenshots": true,
    "saveLogs": true
  },
  "features": [
    "auth-login",
    "project-create",
    "rfi-create"
  ]
}
```

## Writing Tests

Tests are JSON files in `.claude/testing/features/`.

### Test Structure

```json
{
  "id": "unique-test-id",
  "name": "Human-Readable Test Name",
  "module": "feature-module",
  "prerequisites": ["other-test-id"],  // Optional
  "steps": [
    {
      "action": "navigate",
      "value": "http://localhost:3000/page",
      "description": "Navigate to page",
      "timeout": 10000
    },
    {
      "action": "click",
      "selector": "[data-testid='button']",
      "description": "Click button",
      "screenshot": true
    },
    {
      "action": "type",
      "selector": "[name='input']",
      "value": "text to type",
      "description": "Enter text"
    },
    {
      "action": "assert",
      "selector": ".success-message",
      "description": "Verify success",
      "critical": true
    }
  ],
  "cleanup": [
    {
      "action": "navigate",
      "value": "http://localhost:3000/cleanup",
      "description": "Cleanup test data"
    }
  ]
}
```

### Available Actions

- **navigate** - Navigate to a URL
  - `value`: URL to navigate to
  - `timeout`: Max wait time for page load

- **click** - Click an element
  - `selector`: CSS selector
  - `timeout`: Max wait time for element

- **type** - Type text into an input
  - `selector`: CSS selector
  - `value`: Text to type
  - `timeout`: Max wait time for element

- **wait** - Wait for a duration
  - `value`: Milliseconds to wait

- **assert** - Assert element exists
  - `selector`: CSS selector
  - `timeout`: Max wait time for element
  - `critical`: If true, stop test on failure

- **screenshot** - Capture a screenshot
  - No parameters needed

### Example: Login Test

```json
{
  "id": "auth-login",
  "name": "User Authentication - Login",
  "module": "auth",
  "steps": [
    {
      "action": "navigate",
      "value": "http://localhost:3000/login",
      "description": "Navigate to login page"
    },
    {
      "action": "type",
      "selector": "[name='email']",
      "value": "test@example.com",
      "description": "Enter email"
    },
    {
      "action": "type",
      "selector": "[name='password']",
      "value": "password123",
      "description": "Enter password"
    },
    {
      "action": "click",
      "selector": "[type='submit']",
      "description": "Click login",
      "screenshot": true
    },
    {
      "action": "assert",
      "selector": "[data-testid='dashboard']",
      "description": "Verify logged in"
    }
  ]
}
```

## Error Handling

### Error Classification

The system automatically classifies errors:

| Error Type | Examples | Agent Deployed |
|------------|----------|----------------|
| `build-error` | TypeScript compilation errors | `/build-doctor` |
| `database-error` | RLS, SQL, foreign key violations | `/database` |
| `runtime-error` | JavaScript exceptions, null refs | `/debugger` |
| `network-error` | API failures, 4xx/5xx responses | `/debugger` |
| `ui-error` | Element not found, selector timeout | `/code-review` |
| `timeout-error` | Slow page loads, hung requests | `/performance` |

### Retry Logic

When a test fails:

1. **Capture error details** (message, stack, screenshot, logs)
2. **Classify error type** (build, database, runtime, etc.)
3. **Deploy specialist agent** to fix the issue
4. **Wait for fix** (agent reports completion)
5. **Retry test** (attempt 2/3)
6. **Repeat if needed** (attempt 3/3)
7. **Mark as FAILED** if all attempts fail

### Agent Deployment

Agents receive detailed context:
- Test ID and name
- Failed step description
- Error message and stack trace
- Screenshot at time of failure
- Console logs (last 50 entries)
- Network errors (failed requests)

Example agent prompt:
```
**Test Failure Detected**

Test: rfi-create
Step: Click Submit button
Error Type: runtime-error
Agent: /debugger

**Error Message:**
Cannot read property 'id' of undefined

**Stack Trace:**
at components/rfis/rfi-form.tsx:123

**Screenshot:** test-results/screenshots/rfi-create-error.png

**Console Errors:**
- TypeError: Cannot read property 'id' of undefined
- Warning: Uncontrolled component

**Task:** Fix this error so the test can pass when retried.
```

## Reports

### JSON Report

Generated at `test-results/test-run-{timestamp}.json`

```json
{
  "runId": "test-run-1706192736845",
  "startTime": "2025-01-25T12:05:36.845Z",
  "endTime": "2025-01-25T12:08:42.123Z",
  "duration": 185278,
  "summary": {
    "total": 3,
    "passed": 2,
    "failed": 1,
    "skipped": 0,
    "retried": 1
  },
  "results": [
    {
      "testId": "auth-login",
      "name": "User Authentication - Login",
      "status": "passed",
      "duration": 12450,
      "attempts": 1,
      "screenshots": [],
      "logs": [],
      "agentsDeployed": []
    }
  ]
}
```

### HTML Report

Generated at `test-results/test-run-{timestamp}.html`

Features:
- Summary dashboard with pass/fail counts
- Pass rate percentage
- Individual test results
- Error messages and stack traces
- Duration and attempt counts
- Agent deployment history

## Visual Feedback

### Browser Window

Tests run in a visible Chrome window:
- Elements highlight in yellow before interaction
- Page border is green while running, red on errors
- Progress overlay shows current test and step

### Progress Overlay

Appears in bottom-right corner:
```
┌─────────────────────────────────┐
│ 🤖 Autonomous Test Runner       │
│ Test: Create RFI (2/3)          │
│ Step: Click Submit (4/6)        │
│ Status: ✓ Running               │
│ Retries: 0/3                    │
└─────────────────────────────────┘
```

### Console Logs

Test execution is logged to browser console:
- Blue: Test step execution
- Red: Errors and failures
- Timestamps for all events

## Troubleshooting

### Chrome fails to launch

**Error:** `Failed to connect to Chrome`

**Solution:**
1. Ensure port 9222 is not in use
2. Close any existing Chrome instances
3. Try running Chrome manually: `chrome --remote-debugging-port=9222`

### Tests timeout

**Error:** `Timeout waiting for selector`

**Solution:**
1. Increase timeout in test step config
2. Check if selector is correct
3. Ensure application is running on correct port
4. Use DevTools to inspect page and find correct selector

### Agent deployment fails

**Error:** `Agent did not report completion`

**Solution:**
1. Check agent logs for errors
2. Ensure slash command exists (e.g., `/debugger`)
3. Verify agent has necessary permissions
4. Try manual agent invocation to test

### Screenshots not saved

**Error:** Screenshots missing in reports

**Solution:**
1. Ensure `test-results/screenshots/` directory exists
2. Check `screenshotOnError: true` in config
3. Verify file permissions on output directory

## Best Practices

### Test Design

1. **Keep tests focused** - One feature per test
2. **Use data-testid** - Add `data-testid` attributes for stable selectors
3. **Handle async properly** - Use waits after actions that trigger navigation/API calls
4. **Make tests idempotent** - Tests should be repeatable
5. **Add cleanup steps** - Clean up test data to avoid pollution

### Selectors

Prefer in order:
1. `[data-testid='...']` - Most stable
2. `[aria-label='...']` - Accessibility-friendly
3. `#id` - Unique IDs
4. `.class` - Class names (less stable)
5. Tag + nth-child - Last resort (very fragile)

### Error Messages

Make assertions descriptive:
```json
{
  "action": "assert",
  "selector": "[data-testid='dashboard']",
  "description": "Verify user landed on dashboard after login"
}
```

### Prerequisites

Use prerequisites to avoid duplication:
```json
{
  "id": "rfi-create",
  "prerequisites": ["auth-login"],
  "steps": [...]
}
```

The orchestrator will run `auth-login` first, then reuse the session.

## Advanced Usage

### Slow Motion Mode

Set `slowMo` in config to slow down test execution:
```json
{
  "chrome": {
    "slowMo": 1000  // 1 second delay between actions
  }
}
```

Useful for:
- Debugging tests
- Demonstrating features
- Recording videos

### Pause on Error

Enable interactive debugging:
```json
{
  "orchestrator": {
    "pauseOnError": true
  }
}
```

When enabled, tests pause on error and show controls:
- Continue - Resume execution
- Retry - Retry current step
- Skip - Skip current test
- Abort - Stop all tests

### Headless Mode

Run tests without visible browser:
```json
{
  "chrome": {
    "headless": true,
    "devtools": false
  }
}
```

Useful for CI/CD environments.

## Integration with CI/CD

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run dev & sleep 10
      - run: /test:orchestrate --headless
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## FAQ

**Q: Can I run specific tests instead of the full suite?**
A: Yes, edit `features` array in config.json to include only desired test IDs.

**Q: How do I skip a failing test?**
A: Remove it from `features` array or add `"skip": true` to the test JSON.

**Q: Can agents actually fix code?**
A: Yes! Agents have full access to the codebase and can make edits, just like in normal Claude Code usage.

**Q: What if I want to test on staging instead of local?**
A: Edit the `value` URLs in your test steps to point to staging environment.

**Q: How do I add custom assertions?**
A: Extend the ChromeClient class with custom methods, or use JavaScript evaluation in steps.

## Contributing

To add new test actions or improve the orchestrator:

1. Edit `lib/testing/types.ts` to add new action types
2. Update `lib/testing/chrome-client.ts` to implement action
3. Update `lib/testing/orchestrator.ts` to handle new action
4. Add documentation here

## Support

For issues or questions:
- Check existing test failures in `test-results/`
- Review agent logs for fix attempts
- Consult error classification in this doc
- Verify selectors using Chrome DevTools

---

**Happy Testing! 🤖**
