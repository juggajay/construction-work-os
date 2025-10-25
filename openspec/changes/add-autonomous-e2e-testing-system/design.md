# Design: Autonomous End-to-End Testing System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Orchestrator Agent                   │
│  - Manages test execution flow                              │
│  - Coordinates specialist agents                            │
│  - Tracks test state and results                            │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
             ▼                           ▼
┌────────────────────────┐    ┌──────────────────────────┐
│   Chrome MCP Client    │    │   Agent Router           │
│  - Browser automation  │    │  - Detects error types   │
│  - Screenshots         │    │  - Deploys specialists   │
│  - Console logs        │    │  - Waits for fixes       │
│  - Network monitoring  │    │  - Returns control       │
└────────────────────────┘    └──────────────────────────┘
             │                           │
             ▼                           ▼
┌────────────────────────┐    ┌──────────────────────────┐
│  Visual Test Runner    │    │  Specialist Agents       │
│  - Real-time browser   │    │  - /debugger             │
│  - Step-by-step view   │    │  - /database             │
│  - Progress indicators │    │  - /build-doctor         │
│  - Error highlights    │    │  - /code-review          │
└────────────────────────┘    └──────────────────────────┘
             │                           │
             ▼                           ▼
┌────────────────────────────────────────────────────────┐
│                    Test Reporter                        │
│  - Generate HTML/JSON reports                          │
│  - Save screenshots and logs                           │
│  - Track metrics (pass rate, time, retries)           │
└────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Test Orchestrator Agent
**Purpose**: Master controller that manages the entire test lifecycle.

**Responsibilities**:
- Load feature test definitions
- Execute tests sequentially (one feature at a time)
- Detect failures and classify error types
- Route errors to appropriate specialist agents
- Implement retry logic with max attempts
- Track overall test progress and state
- Generate final test report

**Implementation**:
- New slash command: `/test:orchestrate`
- Uses TodoWrite to track progress
- Maintains test state in memory or JSON file
- Configurable via `.claude/testing/config.json`

### 2. Chrome MCP Integration
**Purpose**: Browser automation and observation via Chrome DevTools Protocol.

**Capabilities**:
- Launch Chrome in debug mode
- Navigate to application URLs
- Execute JavaScript in page context
- Capture screenshots at each step
- Monitor console logs (errors, warnings)
- Track network requests/responses
- Simulate user interactions (click, type, scroll)

**MCP Server Setup**:
```bash
# Install Chrome MCP server
npm install -g @modelcontextprotocol/server-chrome

# Start server (in separate terminal)
npx @modelcontextprotocol/server-chrome --port 9222
```

**Connection**:
- Connect via WebSocket to `ws://localhost:9222`
- Use Chrome DevTools Protocol commands
- Handle browser lifecycle (launch, close, restart)

### 3. Feature Test Definitions
**Purpose**: Declarative test scenarios for each feature.

**Structure**:
```typescript
interface FeatureTest {
  id: string // "auth-login", "rfi-create", etc.
  name: string
  module: string // "auth", "rfis", "submittals", etc.
  prerequisites?: string[] // Dependencies on other tests
  steps: TestStep[]
  cleanup?: TestStep[] // Teardown actions
}

interface TestStep {
  action: "navigate" | "click" | "type" | "wait" | "assert"
  selector?: string
  value?: string
  timeout?: number
  screenshot?: boolean
  description: string
}
```

**Example Test**:
```json
{
  "id": "rfi-create",
  "name": "Create RFI",
  "module": "rfis",
  "prerequisites": ["auth-login", "project-select"],
  "steps": [
    {
      "action": "navigate",
      "value": "/org-slug/projects/project-id/rfis",
      "description": "Navigate to RFIs page"
    },
    {
      "action": "click",
      "selector": "[data-testid='create-rfi-button']",
      "description": "Click Create RFI button"
    },
    {
      "action": "type",
      "selector": "[name='subject']",
      "value": "Test RFI Subject",
      "description": "Enter RFI subject"
    },
    {
      "action": "click",
      "selector": "[type='submit']",
      "screenshot": true,
      "description": "Submit RFI form"
    },
    {
      "action": "assert",
      "selector": ".success-message",
      "description": "Verify success message appears"
    }
  ]
}
```

### 4. Error Detection & Agent Routing
**Purpose**: Analyze failures and deploy the right specialist agent.

**Error Classification**:
```typescript
type ErrorType =
  | "build-error"      // TypeScript, compilation errors → /build-doctor
  | "database-error"   // SQL, RLS, migration issues → /database
  | "runtime-error"    // JavaScript exceptions → /debugger
  | "network-error"    // API failures, 4xx/5xx → /debugger
  | "ui-error"         // Element not found, assertions → /code-review
  | "timeout-error"    // Slow loading, infinite loops → /performance
```

**Routing Logic**:
```typescript
function routeError(error: TestError): string {
  if (error.message.includes("tsc") || error.type === "build") {
    return "/build-doctor"
  }
  if (error.message.includes("RLS") || error.message.includes("SQL")) {
    return "/database"
  }
  if (error.type === "console-error" || error.stack) {
    return "/debugger"
  }
  if (error.selector && !error.elementFound) {
    return "/code-review"
  }
  return "/debugger" // Default
}
```

### 5. Retry & Recovery Logic
**Purpose**: Automatically retry tests after fixes are applied.

**Strategy**:
1. **Immediate Retry**: After specialist agent reports fix complete
2. **Max Attempts**: Limit to 3 attempts per test to avoid infinite loops
3. **Exponential Backoff**: Wait 5s, 10s, 20s between retries
4. **State Persistence**: Track retry count in test state
5. **Failure Escalation**: After max retries, mark as failed and continue to next test

**State Machine**:
```
PENDING → RUNNING → [PASS ✓] → NEXT_TEST
                  ↓
              [FAIL ✗]
                  ↓
            DEPLOY_AGENT → FIXING → RETRY (up to 3x)
                                       ↓
                                  [MAX_RETRIES]
                                       ↓
                                  MARK_FAILED → NEXT_TEST
```

### 6. Visual Feedback
**Purpose**: Show test execution in real-time browser window.

**Implementation**:
- Launch Chrome with `--auto-open-devtools-for-tabs`
- Inject visual indicators into page:
  - Green border: Current step executing
  - Red flash: Error detected
  - Yellow highlight: Element being interacted with
- Display progress overlay:
  ```
  ┌─────────────────────────────────┐
  │ Testing: Create RFI (3/25)      │
  │ Step: Click Submit (4/6)        │
  │ Status: ✓ Passed                │
  │ Retries: 0/3                    │
  └─────────────────────────────────┘
  ```
- Pause on errors (with continue/skip/abort options)

### 7. Test Reporting
**Purpose**: Generate comprehensive test reports.

**Report Format**:
```json
{
  "runId": "test-run-2025-01-25-123456",
  "startTime": "2025-01-25T12:34:56Z",
  "endTime": "2025-01-25T12:45:32Z",
  "duration": 636000,
  "summary": {
    "total": 25,
    "passed": 23,
    "failed": 2,
    "skipped": 0,
    "retried": 4
  },
  "results": [
    {
      "testId": "rfi-create",
      "status": "passed",
      "duration": 12000,
      "attempts": 2,
      "screenshots": ["rfi-create-1.png", "rfi-create-2.png"],
      "logs": ["console.log output..."],
      "agentsDeployed": ["/debugger"]
    }
  ]
}
```

**HTML Report**:
- Dashboard with pass/fail overview
- Timeline view of test execution
- Expandable test details with screenshots
- Console logs and network traces
- Agent deployment history

## Data Flow

### Test Execution Flow
1. **Orchestrator starts** → Load test suite
2. **For each feature test**:
   ```
   a. Set test status = RUNNING
   b. Execute prerequisites (if not already passed)
   c. For each step:
      - Execute via Chrome MCP
      - Take screenshot (if configured)
      - Capture console logs
      - Check for errors
   d. If error detected:
      - Classify error type
      - Route to specialist agent
      - Wait for agent to fix
      - Retry test (up to max attempts)
   e. If all steps pass:
      - Set status = PASSED
      - Continue to next test
   f. If max retries exceeded:
      - Set status = FAILED
      - Log details
      - Continue to next test
   ```
3. **Generate report** → Save to `test-results/`

### Agent Communication Flow
```
Orchestrator: "Test 'rfi-create' failed with console error:
               'Cannot read property id of undefined at line 123'"
       ↓
Agent Router: "Error type: runtime-error → Deploy /debugger"
       ↓
/debugger:    "Analyzing error... Found null check missing in
               components/rfis/rfi-form.tsx:123"
       ↓
/debugger:    "Applying fix... Added optional chaining"
       ↓
/debugger:    "Fix complete, ready for retry"
       ↓
Orchestrator: "Retrying test 'rfi-create' (attempt 2/3)"
       ↓
[Test executes again via Chrome MCP]
       ↓
Orchestrator: "Test 'rfi-create' PASSED on retry"
```

## Technology Choices

### Chrome DevTools Protocol (CDP)
- **Why**: Standard protocol, stable, well-documented
- **Alternatives considered**: Playwright (too heavy), Puppeteer (similar but CDP is lower-level)
- **Trade-offs**: More manual setup vs higher control

### MCP Server Architecture
- **Why**: Decouples browser automation from agent logic
- **Alternatives considered**: Direct Puppeteer integration (less flexible)
- **Trade-offs**: Extra process to manage vs cleaner separation

### JSON Test Definitions
- **Why**: Declarative, easy to edit, version-controlled
- **Alternatives considered**: TypeScript DSL (more complex), YAML (less structured)
- **Trade-offs**: Less type safety vs simpler authoring

### Sequential Test Execution
- **Why**: Easier to debug, clear progress, matches user request (one feature at a time)
- **Alternatives considered**: Parallel execution (faster but complex)
- **Trade-offs**: Slower total time vs easier troubleshooting

## Configuration

### `.claude/testing/config.json`
```json
{
  "chrome": {
    "headless": false,
    "devtools": true,
    "viewport": { "width": 1920, "height": 1080 },
    "slowMo": 100
  },
  "orchestrator": {
    "maxRetries": 3,
    "retryDelay": 5000,
    "screenshotOnError": true,
    "pauseOnError": false,
    "continueOnFailure": true
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
    "rfi-create",
    "rfi-respond",
    "submittal-create",
    "submittal-review",
    "change-order-create",
    "change-order-approve",
    "daily-report-create"
  ]
}
```

## Security Considerations

1. **Credentials**: Use environment variables, never hardcode
2. **Test Data**: Create/cleanup test users and projects
3. **Isolation**: Run against local/staging, never production
4. **Cleanup**: Always teardown test data after run

## Performance Considerations

1. **Screenshot Optimization**: Only capture on errors or critical steps
2. **Log Filtering**: Only save console errors/warnings, not verbose logs
3. **Network Throttling**: Optional slow network simulation
4. **Parallel Prerequisites**: Cache login/project setup to avoid repetition

## Failure Scenarios

| Scenario | Handling |
|----------|----------|
| Chrome crashes | Restart browser, retry current test |
| MCP connection lost | Reconnect, retry current test |
| Agent deployment fails | Mark test as failed, continue |
| Max retries exceeded | Log failure, continue to next test |
| Network unavailable | Skip network-dependent tests |
| Build fails | Run /build-doctor first, then retry suite |

## Future Enhancements

1. **Parallel Execution**: Run independent tests concurrently
2. **Visual Regression**: Compare screenshots to baselines
3. **Performance Metrics**: Track page load times, API latency
4. **CI/CD Integration**: Run on every commit/PR
5. **Flakiness Detection**: Identify unstable tests
6. **Test Generation**: Auto-generate tests from user recordings
