# Spec: Test Orchestration

## ADDED Requirements

### Requirement: Test Suite Loading
The system SHALL load and validate feature test definitions from configuration.

#### Scenario: Load test suite from JSON
**Given** test definitions exist in `.claude/testing/features/`
**When** the orchestrator initializes
**Then** all JSON files are parsed
**And** test definitions are validated against schema
**And** the total test count is logged

#### Scenario: Detect invalid test definitions
**Given** a test JSON has missing required fields
**When** the orchestrator loads test definitions
**Then** a validation error is thrown
**And** the specific validation failures are logged
**And** the orchestrator exits without running tests

---

### Requirement: Sequential Test Execution
The system SHALL execute feature tests one at a time in configured order.

#### Scenario: Run tests sequentially
**Given** the test suite contains 10 feature tests
**When** the orchestrator starts execution
**Then** test 1 runs to completion before test 2 starts
**And** each test's progress is logged
**And** the orchestrator uses TodoWrite to show "Testing feature X (N/10)"

#### Scenario: Skip tests with failed prerequisites
**Given** test B has prerequisite test A
**And** test A failed
**When** the orchestrator reaches test B
**Then** test B is skipped
**And** the skip reason is logged as "Prerequisite 'A' failed"
**And** the orchestrator continues to the next test

---

### Requirement: Test Step Execution
The system SHALL execute individual test steps and handle failures gracefully.

#### Scenario: Execute test steps in order
**Given** a test has 5 steps defined
**When** the test executes
**Then** step 1 runs, then step 2, and so on
**And** each step's description is logged
**And** the orchestrator updates TodoWrite with current step

#### Scenario: Fail fast on critical errors
**Given** a test step is marked as `critical: true`
**When** the critical step fails
**Then** the remaining steps are skipped
**And** the test is marked as failed
**And** the orchestrator moves to the next test

#### Scenario: Continue on non-critical errors
**Given** a test step is not marked as critical
**When** the step fails
**Then** the error is logged
**And** the remaining steps still execute
**And** the test is marked as failed only if assertions fail

---

### Requirement: Test State Management
The system SHALL track and persist test execution state.

#### Scenario: Track test progress
**Given** tests are executing
**When** the orchestrator processes each test
**Then** state is updated with: PENDING → RUNNING → PASSED/FAILED
**And** retry count is tracked per test
**And** agent deployments are logged

#### Scenario: Resume from interruption
**Given** the orchestrator was interrupted mid-run
**When** the orchestrator restarts with `--resume` flag
**Then** completed tests are skipped
**And** the orchestrator resumes from the last incomplete test
**And** the test state is loaded from `test-results/state.json`

---

### Requirement: Prerequisite Resolution
The system SHALL handle test dependencies and execute prerequisites first.

#### Scenario: Auto-run prerequisites
**Given** test C requires tests A and B
**When** the orchestrator starts test C
**And** tests A and B have not run yet
**Then** test A executes first, then test B, then test C
**And** the execution order is logged

#### Scenario: Reuse passed prerequisites
**Given** test D and E both require test A
**And** test A has already passed
**When** the orchestrator runs test D
**Then** test A is not re-executed
**And** the cached result is used

---

### Requirement: Timeout Management
The system SHALL enforce timeouts at test and step levels.

#### Scenario: Step-level timeout
**Given** a step is configured with `timeout: 10000` (10 seconds)
**When** the step takes longer than 10 seconds
**Then** the step is aborted
**And** a timeout error is logged
**And** a screenshot is captured

#### Scenario: Test-level timeout
**Given** a test is configured with `maxDuration: 60000` (1 minute)
**When** the test exceeds 60 seconds
**Then** all remaining steps are aborted
**And** the test is marked as failed with timeout error
**And** the orchestrator moves to the next test

---

### Requirement: Cleanup and Teardown
The system SHALL execute cleanup steps after each test.

#### Scenario: Run cleanup after successful test
**Given** a test defines cleanup steps (e.g., delete test data)
**When** the test passes
**Then** cleanup steps execute in order
**And** cleanup failures are logged but don't affect test result

#### Scenario: Run cleanup after failed test
**Given** a test defines cleanup steps
**When** the test fails
**Then** cleanup steps still execute
**And** the test environment is reset for the next test

---

### Requirement: Orchestrator Control Commands
The system SHALL provide a slash command interface for test orchestration.

#### Scenario: Run all tests
**Given** the user executes `/test:orchestrate`
**When** the command is invoked
**Then** all configured tests execute sequentially
**And** progress is shown via TodoWrite
**And** a final report is generated

#### Scenario: Run specific test
**Given** the user executes `/test:orchestrate rfi-create`
**When** the command is invoked
**Then** only the "rfi-create" test (and its prerequisites) execute
**And** other tests are skipped

#### Scenario: Run with options
**Given** the user executes `/test:orchestrate --headless --no-screenshots`
**When** the command is invoked
**Then** Chrome runs in headless mode
**And** screenshots are disabled
**And** tests execute faster

---

### Requirement: Progress Tracking
The system SHALL provide real-time progress updates during test execution.

#### Scenario: Update TodoWrite with progress
**Given** the orchestrator is running 25 tests
**When** test 10 starts
**Then** TodoWrite shows "Testing: RFI Create (10/25)"
**And** the current step is shown as "Step: Click Submit (3/5)"
**And** retry count is shown as "Retries: 1/3" if applicable

#### Scenario: Show completion summary
**Given** all tests have completed
**When** the orchestrator finishes
**Then** TodoWrite shows final summary:
```
✓ Passed: 23
✗ Failed: 2
⟳ Retried: 4
⊘ Skipped: 0
```

---

### Requirement: Error Aggregation
The system SHALL collect and aggregate errors for analysis.

#### Scenario: Aggregate errors by type
**Given** multiple tests fail with similar errors
**When** the orchestrator completes
**Then** errors are grouped by type (e.g., "5 tests failed: Element not found")
**And** the aggregated errors are shown in the summary
**And** common patterns are highlighted for fixing
