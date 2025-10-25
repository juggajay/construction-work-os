# Design: Expand E2E Test Coverage

## Overview

This change expands the autonomous E2E testing system from 3 basic tests to 15+ comprehensive tests covering all project workflows. We'll create structured test files for each feature module following the existing JSON format.

## Architecture

### Test File Structure

Each test file follows this structure:
```json
{
  "id": "feature-action",
  "name": "Human Readable Name",
  "module": "feature-module",
  "prerequisites": ["other-test-id"],
  "steps": [
    {
      "action": "navigate|click|type|wait|assert|screenshot",
      "selector": "CSS selector or data-testid",
      "value": "input value",
      "description": "What this step does",
      "timeout": 5000,
      "critical": true
    }
  ],
  "cleanup": []
}
```

### Test Organization

Tests are organized by feature module:

```
.claude/testing/features/
├── auth-login.json                    [EXISTING]
├── project-create.json                [EXISTING]
├── rfi-create.json                    [EXISTING]
├── rfi-list-and-filter.json          [NEW]
├── rfi-respond.json                   [NEW]
├── rfi-close.json                     [NEW]
├── change-order-create.json           [NEW]
├── change-order-approve.json          [NEW]
├── change-order-reject.json           [NEW]
├── daily-report-create.json           [NEW]
├── daily-report-edit.json             [NEW]
├── daily-report-submit.json           [NEW]
├── submittal-create.json              [NEW]
├── submittal-review.json              [NEW]
├── submittal-approve.json             [NEW]
└── project-settings.json              [NEW]
```

## Test Scenarios

### Change Orders Module (3 tests)

1. **create** - Create a new change order
   - Navigate to change orders page
   - Click "New Change Order"
   - Fill form (title, description, cost impact)
   - Add line items
   - Submit
   - Verify creation success

2. **approve** - Approve a pending change order
   - Navigate to pending change orders
   - Click on a change order
   - Review details
   - Click "Approve"
   - Add approval notes
   - Verify status updated to "Approved"

3. **reject** - Reject a change order
   - Navigate to pending change orders
   - Click on a change order
   - Click "Reject"
   - Add rejection reason
   - Verify status updated to "Rejected"

### Daily Reports Module (3 tests)

1. **create** - Create a daily report
   - Navigate to daily reports
   - Click "New Daily Report"
   - Select date
   - Add work performed
   - Add equipment used
   - Add weather conditions
   - Upload photos
   - Save draft
   - Verify saved

2. **edit** - Edit an existing draft report
   - Navigate to daily reports
   - Open draft report
   - Modify work performed
   - Add additional notes
   - Save changes
   - Verify updates saved

3. **submit** - Submit a daily report
   - Navigate to daily reports
   - Open draft report
   - Review all sections
   - Click "Submit"
   - Confirm submission
   - Verify status changed to "Submitted"

### Submittals Module (3 tests)

1. **create** - Create a submittal
   - Navigate to submittals
   - Click "New Submittal"
   - Fill form (spec section, description)
   - Set required by date
   - Assign reviewer
   - Upload documents
   - Submit
   - Verify creation

2. **review** - Review a submittal
   - Navigate to submittals requiring review
   - Open a submittal
   - Download attached documents
   - Add review comments
   - Mark reviewed
   - Verify status updated

3. **approve** - Approve a submittal
   - Navigate to reviewed submittals
   - Open a submittal
   - Review comments
   - Select "Approved"
   - Add approval notes
   - Submit approval
   - Verify status "Approved"

### RFIs Module (3 additional tests)

1. **list-and-filter** - View and filter RFI list
   - Navigate to RFIs page
   - Verify RFI list displays
   - Apply status filter
   - Apply date range filter
   - Search by keyword
   - Verify filtered results

2. **respond** - Respond to an RFI
   - Navigate to open RFIs
   - Click on an RFI
   - Read question
   - Click "Respond"
   - Enter response text
   - Upload attachments
   - Submit response
   - Verify response recorded

3. **close** - Close an RFI
   - Navigate to answered RFIs
   - Open an RFI with response
   - Review response
   - Click "Close RFI"
   - Confirm closure
   - Verify status "Closed"

### Project Management (2 tests)

1. **settings** - Update project settings
   - Navigate to project settings
   - Update project name
   - Update project address
   - Update contact information
   - Save changes
   - Verify settings saved

2. **overview** - View project overview
   - Navigate to project overview
   - Verify project details display
   - Check stats (RFI count, submittal count, etc.)
   - Verify recent activity feed
   - Navigate to different sections

## Technical Decisions

### Selector Strategy

Use `data-testid` attributes for stability:
```html
<button data-testid="create-change-order-button">Create</button>
```

Fallback to semantic selectors:
```json
{
  "selector": "[data-testid='submit-button'], [type='submit']"
}
```

### Wait Strategy

1. **Explicit waits** for known delays (API calls)
2. **Smart waits** for element appearance
3. **slowMo** config for visibility during manual observation

### Error Handling

Tests should handle common errors gracefully:
- Missing elements (timeout and retry)
- Network errors (agent deployment)
- UI state changes (wait for stability)

### Test Data

Use predictable test data:
- Prefix all test data with "E2E Test -" for easy cleanup
- Use fixed IDs where possible
- Clean up created data in test cleanup phase

## Implementation Plan

### Phase 1: Change Orders Tests (Week 1)
- Create 3 change order test files
- Validate selectors exist in UI
- Run and debug tests

### Phase 2: Daily Reports Tests (Week 1)
- Create 3 daily report test files
- Validate file upload functionality
- Run and debug tests

### Phase 3: Submittals Tests (Week 2)
- Create 3 submittal test files
- Validate approval workflows
- Run and debug tests

### Phase 4: RFI Expansion (Week 2)
- Add 3 additional RFI tests
- Validate complete RFI lifecycle
- Run and debug tests

### Phase 5: Project Management (Week 2)
- Create 2 project management tests
- Validate settings persistence
- Run full test suite

## Testing Strategy

1. **Individual test validation** - Run each test in isolation
2. **Sequential execution** - Run all tests in order
3. **Error injection** - Test error handling and retries
4. **Full regression** - Run entire suite before deploying

## Monitoring & Reporting

Tests will generate:
- JSON reports with detailed step results
- HTML reports with screenshots
- Console output with real-time progress
- Error logs with stack traces and screenshots

## Rollout Plan

1. Create all test files
2. Validate selectors in each UI
3. Run tests individually
4. Fix any failures
5. Run full suite
6. Document known issues
7. Enable in CI/CD pipeline
