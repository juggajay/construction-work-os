# Proposal: Autonomous End-to-End Testing System

## Summary
Implement a comprehensive autonomous testing system that uses Chrome DevTools MCP to test all application features end-to-end. The system features an orchestrator agent that systematically tests each feature, automatically deploys specialist agents to fix errors, and retries until all features pass—all while providing real-time visual feedback.

## Motivation
Currently, testing is manual and time-consuming. As the application grows with modules like RFIs, Submittals, Change Orders, and Daily Reports, ensuring all features work correctly becomes increasingly difficult. We need an autonomous system that:

1. **Systematically tests every feature** - No feature left untested
2. **Automatically fixes issues** - Deploys the right specialist agent (debugger, database, build-doctor, etc.) when errors occur
3. **Provides visibility** - Shows what's being tested in real-time using Chrome DevTools
4. **Enables continuous validation** - Can be run before deployments to catch regressions
5. **Reduces manual QA burden** - Autonomous retries and fixes without human intervention

## Goals
- ✅ Test all core workflows: Auth, Projects, RFIs, Submittals, Change Orders, Daily Reports
- ✅ Automatic error detection and agent-based fixing
- ✅ Visual feedback through Chrome DevTools MCP
- ✅ Feature-by-feature testing with retry logic
- ✅ Detailed test reports with screenshots and logs
- ✅ Integration with existing Claude Code agents

## Non-Goals
- ❌ Performance/load testing (use k6 instead)
- ❌ Unit/integration testing (use Vitest/Playwright directly)
- ❌ Replacing manual exploratory testing
- ❌ Testing third-party integrations (QuickBooks, email, etc.)

## Scope
This proposal introduces:

1. **Chrome MCP Integration** - Connect to browser via Chrome DevTools Protocol
2. **Test Orchestrator Agent** - Master controller that runs feature tests sequentially
3. **Error Detection & Routing** - Analyze failures and deploy correct specialist agent
4. **Visual Test Runner** - Real-time browser view of test execution
5. **Feature Test Suite** - Comprehensive tests for all modules
6. **Retry & Recovery Logic** - Automatic retry after fixes with max attempt limits
7. **Test Reporting** - Detailed reports with screenshots, console logs, network traces

## Success Criteria
- [ ] All existing features (auth, projects, RFIs, submittals, change orders, daily reports) have automated E2E tests
- [ ] Orchestrator successfully runs all tests autonomously
- [ ] When tests fail, appropriate agent is deployed and fixes are applied
- [ ] Test execution is visible in Chrome browser window
- [ ] Test reports include screenshots, logs, and error details
- [ ] System can run on-demand or as pre-deployment gate

## Timeline Estimate
- Week 1: Chrome MCP setup, basic orchestrator, simple test scenarios
- Week 2: Error routing, agent integration, retry logic
- Week 3: Full feature test suite, visual feedback
- Week 4: Reporting, documentation, CI/CD integration

## Dependencies
- Chrome DevTools MCP server
- Existing Claude Code agents (/debugger, /database, /build-doctor, etc.)
- Running local or deployed application instance
- Node.js test runner infrastructure

## Related Changes
- Complements existing manual testing workflows
- Builds on top of existing agent system
- May eventually feed into CI/CD pipeline (future work)
