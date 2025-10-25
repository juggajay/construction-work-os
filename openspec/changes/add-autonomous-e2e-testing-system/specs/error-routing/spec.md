# Spec: Error Detection and Agent Routing

## ADDED Requirements

### Requirement: Error Classification
The system SHALL analyze test failures and classify them by error type.

#### Scenario: Classify build errors
**Given** a test fails with error message containing "tsc" or "Type 'string' is not assignable"
**When** the error is analyzed
**Then** the error type is classified as "build-error"
**And** the `/build-doctor` agent is selected for routing

#### Scenario: Classify database errors
**Given** a test fails with error message containing "RLS" or "violates row-level security policy"
**When** the error is analyzed
**Then** the error type is classified as "database-error"
**And** the `/database` agent is selected for routing

#### Scenario: Classify runtime JavaScript errors
**Given** a test fails with console error "Cannot read property 'id' of undefined"
**When** the error is analyzed
**Then** the error type is classified as "runtime-error"
**And** the `/debugger` agent is selected for routing

#### Scenario: Classify UI element errors
**Given** a test fails because selector `[data-testid='submit-button']` is not found
**When** the error is analyzed
**Then** the error type is classified as "ui-error"
**And** the `/code-review` agent is selected for routing

#### Scenario: Classify network/API errors
**Given** a test fails with API response status 500
**When** the error is analyzed
**Then** the error type is classified as "network-error"
**And** the `/debugger` agent is selected for routing

---

### Requirement: Agent Deployment
The system SHALL deploy specialist agents to fix detected errors.

#### Scenario: Deploy agent for build error
**Given** a test failed with build-error classification
**When** the agent router processes the error
**Then** the `/build-doctor` SlashCommand is invoked
**And** the error details are passed to the agent
**And** the orchestrator waits for agent completion

#### Scenario: Deploy agent for database error
**Given** a test failed with database-error classification
**When** the agent router processes the error
**Then** the `/database` SlashCommand is invoked with context:
  - Error message
  - SQL query (if available from network logs)
  - Affected table/policy
**And** the orchestrator waits for the agent to apply fixes

#### Scenario: Deploy agent for runtime error
**Given** a test failed with runtime-error in `components/rfis/rfi-form.tsx:123`
**When** the agent router processes the error
**Then** the `/debugger` SlashCommand is invoked with:
  - File path: `components/rfis/rfi-form.tsx`
  - Line number: 123
  - Error message and stack trace
**And** the orchestrator waits for the fix

---

### Requirement: Agent Communication Protocol
The system SHALL communicate with agents using a structured protocol.

#### Scenario: Send error context to agent
**Given** an agent is being deployed
**When** the SlashCommand is invoked
**Then** the following context is provided:
  - Test ID and name
  - Failed step description
  - Error type and message
  - Stack trace (if available)
  - Screenshot path
  - Console logs
  - Network logs
**And** the agent receives a clear task: "Fix this error so the test can pass"

#### Scenario: Receive agent completion signal
**Given** an agent is working on a fix
**When** the agent completes its work
**Then** the agent outputs a completion signal (e.g., "Fix applied successfully")
**And** the orchestrator detects this signal
**And** the orchestrator marks the agent work as complete

---

### Requirement: Fix Verification
The system SHALL verify that agent fixes resolve the error.

#### Scenario: Retry test after agent fix
**Given** the `/debugger` agent reports "Fix applied successfully"
**When** the orchestrator receives the completion signal
**Then** the failed test is retried from the beginning
**And** the retry count is incremented
**And** if the test passes, it's marked as PASSED (with retry count)

#### Scenario: Handle unsuccessful fix
**Given** an agent reports fix completion
**When** the test is retried
**And** the same error occurs again
**Then** the retry count is checked
**And** if retries < maxRetries, the agent is deployed again
**And** if retries >= maxRetries, the test is marked as FAILED

---

### Requirement: Multi-Agent Coordination
The system SHALL handle errors requiring multiple agents.

#### Scenario: Sequential agent deployment
**Given** a test fails with a build error
**When** `/build-doctor` fixes the TypeScript error
**And** retry reveals a database RLS error
**Then** the `/database` agent is deployed for the second error
**And** both agent invocations are logged in the test result

#### Scenario: Agent dependency tracking
**Given** multiple tests fail with the same root cause
**When** the first agent deployment fixes the root cause
**Then** subsequent tests are retried without re-deploying the agent
**And** the fix is reused across tests

---

### Requirement: Agent Timeout Handling
The system SHALL enforce timeouts on agent execution.

#### Scenario: Agent timeout
**Given** an agent is deployed to fix an error
**When** 5 minutes elapse without completion signal
**Then** the agent work is marked as timed out
**And** the test retry proceeds anyway (in case fix was partial)
**And** if retry fails, the test is marked as failed

#### Scenario: Agent failure detection
**Given** an agent throws an error during execution
**When** the orchestrator detects the agent error
**Then** the agent work is marked as failed
**And** the error is logged
**And** the test is retried once without agent intervention

---

### Requirement: Error Context Enrichment
The system SHALL enrich error context before routing to agents.

#### Scenario: Include screenshot in error context
**Given** a test fails with a UI error
**When** the error is prepared for agent deployment
**Then** the screenshot captured at failure is included
**And** the agent receives the visual context

#### Scenario: Include console logs in error context
**Given** a test fails with a runtime error
**When** the error is prepared for agent deployment
**Then** the last 50 console log entries are included
**And** the agent can analyze the logs for debugging

#### Scenario: Include network trace in error context
**Given** a test fails with an API error
**When** the error is prepared for agent deployment
**Then** the API request/response details are included
**And** the agent can analyze the network interaction

---

### Requirement: Fallback Routing
The system SHALL have fallback logic when error type is ambiguous.

#### Scenario: Unknown error type
**Given** a test fails with an unclassifiable error
**When** the error router processes it
**Then** the `/debugger` agent is selected as default
**And** a warning is logged: "Error type unknown, using default agent"

#### Scenario: Multiple applicable agents
**Given** an error could be classified as both runtime-error and ui-error
**When** the error router processes it
**Then** the more specific classification is chosen (runtime-error)
**And** the primary agent (`/debugger`) is deployed first
**And** if that fails, the secondary agent (`/code-review`) is tried

---

### Requirement: Agent Retry Strategy
The system SHALL implement intelligent retry logic for agent deployments.

#### Scenario: Exponential backoff between agent retries
**Given** an agent fix didn't resolve the error
**When** the test is retried
**Then** retry 1 waits 5 seconds before re-deploying agent
**And** retry 2 waits 10 seconds
**And** retry 3 waits 20 seconds

#### Scenario: Skip agent on final retry
**Given** a test has failed twice with agent fixes
**When** the max retry count is reached (3)
**Then** the final retry skips agent deployment
**And** the test runs once more with existing code
**And** if it still fails, it's marked as FAILED with all details logged
