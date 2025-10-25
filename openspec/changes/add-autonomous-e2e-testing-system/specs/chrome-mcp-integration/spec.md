# Spec: Chrome MCP Integration

## ADDED Requirements

### Requirement: Chrome DevTools Protocol Connection
The system SHALL establish a connection to Chrome browser via Chrome DevTools Protocol (CDP).

#### Scenario: Connect to Chrome instance
**Given** Chrome is running with remote debugging enabled on port 9222
**When** the test orchestrator initializes
**Then** a WebSocket connection to `ws://localhost:9222` is established
**And** the connection remains stable throughout test execution

#### Scenario: Handle connection failures
**Given** Chrome is not running or port 9222 is unavailable
**When** the orchestrator attempts to connect
**Then** an error is logged with instructions to start Chrome
**And** the orchestrator exits gracefully without starting tests

---

### Requirement: Browser Launch and Configuration
The system SHALL launch Chrome with appropriate flags for testing and visibility.

#### Scenario: Launch Chrome with DevTools open
**Given** the orchestrator is starting a test run
**When** no Chrome instance is detected
**Then** Chrome launches with `--remote-debugging-port=9222` and `--auto-open-devtools-for-tabs`
**And** the browser window is visible to the user
**And** the viewport is set to 1920x1080

#### Scenario: Use existing Chrome instance
**Given** Chrome is already running with debugging enabled
**When** the orchestrator starts
**Then** the existing instance is reused
**And** a new tab is created for testing

---

### Requirement: Page Navigation
The system SHALL navigate to application URLs and wait for page readiness.

#### Scenario: Navigate to application page
**Given** a test step specifies navigation to `/org/projects/123/rfis`
**When** the navigation command is executed
**Then** the browser loads the URL
**And** the orchestrator waits for `document.readyState === 'complete'`
**And** a screenshot is captured after page load

#### Scenario: Handle navigation timeout
**Given** a page is slow to load
**When** 30 seconds elapse without readyState complete
**Then** the step is marked as failed
**And** a timeout error is logged with the URL

---

### Requirement: User Interaction Simulation
The system SHALL simulate user interactions (click, type, scroll) via CDP.

#### Scenario: Click element by selector
**Given** a test step specifies clicking `[data-testid='submit-button']`
**When** the click action is executed
**Then** CDP sends `Runtime.evaluate` with `document.querySelector(...).click()`
**And** the orchestrator waits 500ms for any side effects
**And** console logs are captured

#### Scenario: Type text into input field
**Given** a test step specifies typing "Test RFI Subject" into `[name='subject']`
**When** the type action is executed
**Then** CDP sends `Runtime.evaluate` to set the input value
**And** a 'input' event is dispatched to trigger React state updates
**And** the new value is verified

#### Scenario: Element not found
**Given** a test step specifies clicking `[data-testid='nonexistent']`
**When** the click action is executed
**Then** CDP returns null for querySelector
**And** the step fails with "Element not found" error
**And** a screenshot is captured showing the current page state

---

### Requirement: Console Log Monitoring
The system SHALL capture and analyze browser console logs during test execution.

#### Scenario: Capture console errors
**Given** a page executes `console.error("API request failed")`
**When** the orchestrator is monitoring the page
**Then** the error is captured with timestamp and stack trace
**And** the error is included in the test report

#### Scenario: Filter console noise
**Given** a page logs numerous debug messages
**When** console monitoring is active
**Then** only errors and warnings are captured
**And** verbose logs are ignored

---

### Requirement: Screenshot Capture
The system SHALL capture screenshots at key points during test execution.

#### Scenario: Capture screenshot on step completion
**Given** a test step has `screenshot: true` configured
**When** the step completes successfully
**Then** a screenshot is captured via `Page.captureScreenshot`
**And** the screenshot is saved to `test-results/screenshots/{test-id}-{step-index}.png`
**And** the screenshot path is included in the step result

#### Scenario: Capture screenshot on error
**Given** a test step fails
**When** the error is detected
**Then** a screenshot is automatically captured
**And** the screenshot is labeled with `-error` suffix
**And** the screenshot shows the exact state when the error occurred

---

### Requirement: Network Request Monitoring
The system SHALL monitor network requests and responses for debugging.

#### Scenario: Track API requests
**Given** a test action triggers an API call to `/api/rfis`
**When** the network request is sent
**Then** the request URL, method, and headers are logged
**And** the response status code and body are captured
**And** the request timing (duration) is recorded

#### Scenario: Detect failed API requests
**Given** an API request returns status 500
**When** the response is received
**Then** the orchestrator logs a network error
**And** the response body is captured for debugging
**And** the test step is marked as failed

---

### Requirement: Browser Cleanup
The system SHALL properly cleanup browser instances after test completion.

#### Scenario: Close browser after successful run
**Given** all tests have completed
**When** the orchestrator shuts down
**Then** all browser tabs are closed
**And** the Chrome process is terminated gracefully
**And** no orphaned processes remain

#### Scenario: Cleanup on test abortion
**Given** tests are running and user presses Ctrl+C
**When** the signal is received
**Then** the current test is marked as aborted
**And** the browser is closed immediately
**And** partial results are saved to report
