# Spec: Visual Test Feedback

## ADDED Requirements

### Requirement: Real-Time Browser Visibility
The system SHALL display test execution in a visible Chrome browser window.

#### Scenario: Launch browser with DevTools open
**Given** the orchestrator starts a test run
**When** Chrome is launched
**Then** the browser window is visible (not headless)
**And** DevTools are automatically opened
**And** the window is positioned on the primary monitor

#### Scenario: Keep browser focused on test page
**Given** tests are executing
**When** each test step runs
**Then** the browser tab remains on the test page
**And** no new tabs are opened unless required by the test
**And** popups and alerts are handled automatically

---

### Requirement: Visual Step Indicators
The system SHALL inject visual indicators into the page during test execution.

#### Scenario: Highlight element being interacted with
**Given** a test step is clicking `[data-testid='submit-button']`
**When** the click action executes
**Then** the target element is highlighted with a yellow border for 500ms
**And** the element pulses twice before the click
**And** the user can visually see what's being clicked

#### Scenario: Show current step border
**Given** a test is executing
**When** a step starts
**Then** the entire page gets a green border (5px solid)
**And** the border persists until the step completes
**And** the border turns red if the step fails

#### Scenario: Flash error indicator
**Given** a test step fails
**When** the error is detected
**Then** the page flashes red 3 times (background color)
**And** the failed element (if applicable) is outlined in red
**And** an error message appears in the top-right corner

---

### Requirement: Progress Overlay Display
The system SHALL display a persistent progress overlay on the browser page.

#### Scenario: Show test progress overlay
**Given** tests are executing
**When** a page is loaded
**Then** an overlay appears in the bottom-right corner with:
  ```
  ┌─────────────────────────────────────┐
  │ 🤖 Autonomous Test Runner           │
  ├─────────────────────────────────────┤
  │ Test: Create RFI (3/25)             │
  │ Step: Click Submit (4/6)            │
  │ Status: ✓ Running                   │
  │ Retries: 0/3                        │
  │ Agent: None                         │
  ├─────────────────────────────────────┤
  │ ⏱️  Elapsed: 00:05:23               │
  └─────────────────────────────────────┘
  ```
**And** the overlay updates in real-time
**And** the overlay is semi-transparent to not block content

#### Scenario: Update overlay on test progress
**Given** the overlay is displayed
**When** the orchestrator moves to the next test
**Then** the "Test:" field updates
**And** the "Step:" field resets to 1
**And** the progress counter increments

#### Scenario: Show agent deployment in overlay
**Given** an error is detected and an agent is deployed
**When** the agent starts working
**Then** the overlay "Agent:" field shows "/debugger"
**And** the "Status:" changes to "🔧 Fixing error"
**And** a spinner animation appears

---

### Requirement: Console Log Injection
The system SHALL inject helpful logs into the browser console.

#### Scenario: Log test step execution
**Given** a test step starts
**When** the step executes
**Then** a console log appears: `[TEST] Step 4/6: Click Submit button`
**And** the log is styled with a blue background for visibility
**And** the log includes a timestamp

#### Scenario: Log errors prominently
**Given** a test step fails
**When** the error is detected
**Then** a console error appears: `[TEST ERROR] Step failed: Element not found - [data-testid='submit-button']`
**And** the error is styled with a red background
**And** the stack trace (if available) is included

---

### Requirement: Screenshot Annotations
The system SHALL annotate screenshots with test context.

#### Scenario: Add test info to screenshot
**Given** a screenshot is captured during a test
**When** the screenshot is saved
**Then** a banner is added to the top with:
  - Test name
  - Step description
  - Timestamp
  - Pass/Fail status
**And** failed elements are highlighted with red boxes

#### Scenario: Add error details to failure screenshot
**Given** a screenshot is captured after a test failure
**When** the screenshot is saved
**Then** the error message is overlaid on the screenshot
**And** the failed selector (if applicable) is shown
**And** a red "X" icon appears in the corner

---

### Requirement: Interactive Pause Controls
The system SHALL provide controls to pause and inspect test execution.

#### Scenario: Auto-pause on error
**Given** the orchestrator is configured with `pauseOnError: true`
**When** a test step fails
**Then** test execution pauses
**And** an overlay appears with options:
  - "Continue" - Resume test execution
  - "Retry Step" - Retry the failed step immediately
  - "Skip Test" - Mark test as skipped and move to next
  - "Abort All" - Stop all remaining tests
**And** the user can inspect the page state

#### Scenario: Manual pause trigger
**Given** tests are executing
**When** the user presses a keyboard shortcut (e.g., Ctrl+P)
**Then** the current step pauses after completion
**And** the pause controls overlay appears
**And** the user can choose to continue or abort

---

### Requirement: Slow Motion Mode
The system SHALL support slow motion execution for debugging.

#### Scenario: Run tests in slow motion
**Given** the orchestrator is started with `slowMo: 1000` config
**When** each test step executes
**Then** a 1-second delay is added before each action
**And** the user can visually follow what's happening
**And** the overlay shows "🐌 Slow Mode: 1000ms"

#### Scenario: Adjust slow motion dynamically
**Given** tests are running in slow motion
**When** the user presses "+" or "-" keys
**Then** the slow motion delay increases/decreases by 500ms
**And** the overlay updates to show the new delay
**And** the setting persists for remaining tests

---

### Requirement: Video Recording (Optional Enhancement)
The system MAY record video of test execution for later review.

#### Scenario: Record test execution video
**Given** the orchestrator is started with `recordVideo: true`
**When** tests execute
**Then** a screen recording is created for the entire run
**And** the video is saved to `test-results/videos/test-run-{timestamp}.mp4`
**And** failed tests are marked with timestamps in a separate file

---

### Requirement: Accessibility of Visual Feedback
The system SHALL ensure visual feedback is accessible and customizable.

#### Scenario: High contrast mode
**Given** the orchestrator is configured with `highContrast: true`
**When** visual indicators are injected
**Then** borders use high-contrast colors (black/yellow instead of green/red)
**And** text overlays have increased font size
**And** the overlay background is opaque

#### Scenario: Disable visual feedback
**Given** the orchestrator is started with `--no-visual-feedback` flag
**When** tests execute
**Then** no overlays or highlights are injected
**And** tests run at full speed without visual delays
**And** the browser window can still be visible for observation
