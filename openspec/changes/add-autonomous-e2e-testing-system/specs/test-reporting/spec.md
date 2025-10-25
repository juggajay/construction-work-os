# Spec: Test Reporting

## ADDED Requirements

### Requirement: JSON Test Report Generation
The system SHALL generate a structured JSON report of test results.

#### Scenario: Generate complete test report
**Given** all tests have completed
**When** the orchestrator finishes execution
**Then** a JSON file is created at `test-results/test-run-{timestamp}.json`
**And** the report includes:
  - Run ID and timestamp
  - Total duration
  - Summary (total, passed, failed, skipped, retried)
  - Individual test results with:
    - Test ID and name
    - Status (passed/failed/skipped)
    - Duration
    - Retry count
    - Screenshots paths
    - Console logs
    - Agents deployed
    - Error details (if failed)

#### Scenario: Report structure validation
**Given** a JSON report is generated
**When** the file is parsed
**Then** it conforms to the defined schema:
```json
{
  "runId": "string",
  "startTime": "ISO 8601",
  "endTime": "ISO 8601",
  "duration": "number (ms)",
  "summary": {
    "total": "number",
    "passed": "number",
    "failed": "number",
    "skipped": "number",
    "retried": "number"
  },
  "results": [
    {
      "testId": "string",
      "name": "string",
      "status": "passed|failed|skipped",
      "duration": "number",
      "attempts": "number",
      "screenshots": ["string[]"],
      "logs": ["string[]"],
      "agentsDeployed": ["string[]"],
      "error": {
        "message": "string",
        "type": "string",
        "stack": "string"
      }
    }
  ]
}
```

---

### Requirement: HTML Report Generation
The system SHALL generate a human-readable HTML report.

#### Scenario: Generate HTML dashboard
**Given** all tests have completed
**When** the orchestrator generates reports
**Then** an HTML file is created at `test-results/test-run-{timestamp}.html`
**And** the HTML includes:
  - Summary dashboard with pass/fail counts
  - Visual progress bar (green for passed, red for failed)
  - Timeline view of test execution
  - Expandable test details
  - Embedded screenshots
  - Syntax-highlighted console logs

#### Scenario: HTML report styling
**Given** an HTML report is generated
**When** the report is opened in a browser
**Then** the report is fully styled with CSS
**And** the design is responsive (mobile-friendly)
**And** passed tests are highlighted in green
**And** failed tests are highlighted in red
**And** skipped tests are grayed out

#### Scenario: Interactive HTML report
**Given** an HTML report is opened
**When** the user clicks on a test row
**Then** the test details expand
**And** screenshots are displayed inline
**And** console logs can be filtered by level (error/warning/info)
**And** network requests are shown in a table

---

### Requirement: Screenshot Management
The system SHALL organize and reference screenshots in reports.

#### Scenario: Save screenshots with context
**Given** a screenshot is captured during a test
**When** the screenshot is saved
**Then** it's stored in `test-results/screenshots/{test-id}-{step-index}.png`
**And** the filename includes the test ID and step index
**And** the file path is recorded in the test result

#### Scenario: Reference screenshots in HTML report
**Given** an HTML report includes a failed test
**When** the test details are expanded
**Then** all screenshots for that test are displayed
**And** each screenshot has a caption with the step description
**And** clicking a screenshot opens it in full size

---

### Requirement: Log Aggregation
The system SHALL aggregate and format console logs for readability.

#### Scenario: Aggregate logs per test
**Given** a test executes and generates console logs
**When** the test completes
**Then** all logs are collected and formatted
**And** logs are grouped by level (error, warning, info)
**And** duplicate logs are deduplicated
**And** timestamps are added to each log entry

#### Scenario: Include logs in JSON report
**Given** a test has console logs
**When** the JSON report is generated
**Then** the logs array includes all captured messages
**And** each log has: level, message, timestamp, source

---

### Requirement: Error Details Documentation
The system SHALL capture comprehensive error details for debugging.

#### Scenario: Capture error context
**Given** a test fails with an error
**When** the error is recorded in the report
**Then** the following details are captured:
  - Error message
  - Error type classification
  - Stack trace
  - Failed selector (if applicable)
  - Screenshot at time of failure
  - Console logs (last 50 entries)
  - Network logs (last 10 requests)

#### Scenario: Document agent interventions
**Given** a test failure triggered agent deployment
**When** the test result is recorded
**Then** the report includes:
  - Which agents were deployed
  - What fixes were attempted
  - Whether fixes were successful
  - Number of retry attempts

---

### Requirement: Summary Statistics
The system SHALL calculate and display summary statistics.

#### Scenario: Calculate pass rate
**Given** 23 tests passed and 2 failed
**When** the summary is generated
**Then** the pass rate is calculated as 92% (23/25)
**And** the summary shows "Pass Rate: 92%"

#### Scenario: Calculate average test duration
**Given** all tests have completed
**When** the summary is generated
**Then** the average test duration is calculated
**And** the summary shows "Avg Duration: 12.5s"

#### Scenario: Track retry statistics
**Given** 4 tests were retried
**When** the summary is generated
**Then** the retry count is shown
**And** the average retries per failed test is calculated

---

### Requirement: Historical Comparison
The system SHALL support comparing test results over time.

#### Scenario: Store historical results
**Given** a test run completes
**When** the report is saved
**Then** the results are also appended to `test-results/history.jsonl`
**And** each line is a complete test run result
**And** the file can be used for trend analysis

#### Scenario: Compare with previous run
**Given** the orchestrator has access to historical results
**When** a new test run completes
**Then** the report includes a comparison section:
  - Tests that were passing but now fail (regressions)
  - Tests that were failing but now pass (fixes)
  - Duration changes (+/- seconds)

---

### Requirement: Report Output Formats
The system SHALL support multiple report output formats.

#### Scenario: Configure output formats
**Given** the orchestrator is configured with `reportFormats: ["html", "json", "markdown"]`
**When** test execution completes
**Then** reports are generated in all specified formats
**And** each format contains the same data

#### Scenario: Generate Markdown report
**Given** markdown format is enabled
**When** the report is generated
**Then** a `test-results/test-run-{timestamp}.md` file is created
**And** the markdown includes:
  - Summary table
  - Test results in a table
  - Links to screenshots
  - Collapsible sections for error details

---

### Requirement: Report Accessibility
The system SHALL make reports accessible and shareable.

#### Scenario: Standalone HTML report
**Given** an HTML report is generated
**When** the file is viewed
**Then** all assets (CSS, screenshots) are embedded or referenced relatively
**And** the report can be opened without a web server
**And** the report can be shared via email or file transfer

#### Scenario: Include reproduction steps
**Given** a test failed
**When** the test result is documented
**Then** the report includes steps to reproduce:
  - Test ID to run: `/test:orchestrate {test-id}`
  - Prerequisites that must pass first
  - Environment requirements (logged-in user, test data)

---

### Requirement: Real-Time Report Updates
The system SHALL update the HTML report in real-time during execution.

#### Scenario: Live HTML report
**Given** the orchestrator is configured with `liveReport: true`
**When** tests are executing
**Then** the HTML report file is updated after each test completes
**And** the user can open the file in a browser and refresh to see progress
**And** the report shows "🔄 In Progress" until all tests complete

---

### Requirement: Export and Integration
The system SHALL support exporting results for CI/CD integration.

#### Scenario: Generate JUnit XML format
**Given** the orchestrator is configured for CI/CD integration
**When** tests complete
**Then** a JUnit XML file is generated at `test-results/junit.xml`
**And** the format is compatible with standard CI/CD tools
**And** each test is represented as a test case

#### Scenario: Generate GitHub Actions summary
**Given** tests are running in GitHub Actions
**When** tests complete
**Then** a summary is written to `$GITHUB_STEP_SUMMARY`
**And** the summary includes:
  - Pass/fail counts
  - Failed test names
  - Links to full report (if uploaded as artifact)
