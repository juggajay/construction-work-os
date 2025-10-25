# Expand E2E Test Coverage for All Project Features

**Status:** Draft
**Created:** 2025-10-25
**Author:** AI Assistant

## Motivation

The autonomous E2E testing system currently has only 3 basic tests:
- `auth-login.json` - Login authentication
- `project-create.json` - Create a new project
- `rfi-create.json` - Create an RFI

This provides minimal coverage. We need comprehensive end-to-end tests for **all major project workflows** to ensure:

1. **Complete feature validation** - Every module (RFIs, Submittals, Change Orders, Daily Reports) is tested
2. **Regression prevention** - Changes don't break existing functionality
3. **Workflow verification** - Multi-step processes work end-to-end
4. **Real-world scenarios** - Tests mirror actual user workflows

## Goals

1. Add comprehensive E2E tests for all project features:
   - **Change Orders** - Create, edit, approve, reject workflows
   - **Daily Reports** - Create, edit, submit, view workflows
   - **Submittals** - Create, review, approve, respond workflows
   - **RFIs** - Expand beyond create to include list, detail, respond, close
   - **Project Management** - Settings, team members, overview

2. Test complete user journeys, not just isolated actions

3. Validate error states and edge cases

4. Ensure tests run reliably and independently

## Scope

### In Scope
- Create test files for Change Orders (3+ test scenarios)
- Create test files for Daily Reports (3+ test scenarios)
- Create test files for Submittals (3+ test scenarios)
- Expand RFI tests beyond creation (2+ additional scenarios)
- Add project management workflow tests (2+ scenarios)
- Update test configuration for better reporting
- Document test scenarios and expected behaviors

### Out of Scope
- Performance testing (covered separately)
- API testing (this is E2E UI testing only)
- Mobile/responsive testing
- Accessibility testing
- Load testing

## Success Criteria

1. **Coverage**: At least 15 total E2E test scenarios across all features
2. **Reliability**: All tests pass consistently on clean database
3. **Independence**: Tests can run in any order without dependencies
4. **Speed**: Full test suite completes in under 10 minutes
5. **Documentation**: Each test has clear descriptions and expected outcomes
6. **Maintainability**: Test files follow consistent structure and naming

## Dependencies

- Existing autonomous E2E testing system (`add-autonomous-e2e-testing-system`)
- All feature modules must be deployed:
  - Change Orders module
  - Daily Reports module
  - Submittals module
  - RFIs module

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tests become flaky due to timing | High | Implement smart waits and retry logic |
| Selectors break when UI changes | Medium | Use semantic selectors (data-testid) |
| Tests take too long to run | Medium | Parallelize where possible, optimize waits |
| Database state affects tests | High | Each test cleans up after itself |

## Alternatives Considered

1. **Manual testing only** - Rejected: Too time-consuming, error-prone
2. **Unit tests only** - Rejected: Don't catch integration issues
3. **API tests only** - Rejected: Miss UI/UX bugs
4. **Playwright instead of Puppeteer** - Deferred: Current system works well

## Related Changes

- `add-autonomous-e2e-testing-system` - Foundation this builds on
- `add-change-orders-module` - Feature being tested
- `add-daily-reports-module` - Feature being tested
- `add-submittals-module` - Feature being tested
- `add-rfi-module` - Feature being tested
