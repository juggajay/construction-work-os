# Claude Code Commands & Agents

This project has **11 custom slash commands** to accelerate development and maintain quality.

## Quick Reference

Type `/` in Claude Code to see all available commands, or use these directly:

### OpenSpec Workflow (Core)

| Command | When to Use | Example |
|---------|-------------|---------|
| `/openspec:proposal` | Creating a new feature/change | "Add RFI workflow" |
| `/openspec:apply` | Implementing an approved proposal | After proposal approved |
| `/openspec:archive` | After deploying a change | When change is live |

### Meta Agent (Intelligent Routing)

| Command | When to Use | Example |
|---------|-------------|---------|
| `/orchestrator` | 🟣 **USE WHEN UNSURE which agent to use** | "Something is broken" (analyzes & routes) |

### Development Agents (Your AI Assistants)

| Command | When to Use | Example |
|---------|-------------|---------|
| `/build-doctor` | 🔴 **USE FIRST when build fails (10+ errors)** | Build failing with 187 TypeScript errors |
| `/debugger` | 🔴 **Any single error or bug** | TypeError, test failure, unexpected behavior |
| `/database` | 🔴 **Migrations, RLS policies** | "Create rfis table with RLS" |
| `/test-writer` | 🔴 **Writing tests** | "Test createProject action" |
| `/domain-validator` | 🟡 **Validate construction logic** | "Is this RFI workflow correct?" |
| `/code-review` | 🟡 **Before archiving** | "Review add-rfi-workflow" |
| `/performance` | 🔵 **Optimization** | "Why is project list slow?" |

**Legend**: 🟣 Intelligent router | 🔴 Use daily | 🟡 Use regularly | 🔵 Use when optimizing

---

## Detailed Usage

### -1. `/orchestrator` - Meta Agent 🟣 **USE WHEN UNSURE**

**Use whenever you encounter**:
- Unsure which agent to use for the task
- Ambiguous problem ("something is broken")
- Getting stuck in loops with other agents
- Need to gather context before deciding
- Multiple possible problem types

**What it does**:
1. **Gathers context first** - Checks build, git status, errors, recent changes
2. **Analyzes problem type** - Uses decision tree to classify issue
3. **Routes to specialist** - Deploys the RIGHT agent for the job
4. **Preserves context** - Passes full context to the specialist
5. **Monitors progress** - Switches agents if stuck (circuit breaker)

**Decision Tree**:
```
Build failing (10+ errors)? → /build-doctor
Database task? → /database
Single error? → /debugger
Performance issue? → /performance
Construction domain? → /domain-validator
Ambiguous? → Ask user for clarification
```

**Example**:
```
You: "Something is broken after pulling changes"

/orchestrator

Agent:
## 🎯 ORCHESTRATOR ANALYSIS

Context Gathered:
- Build status: FAILING (47 errors)
- Recent changes: Database migration (git log)
- Error pattern: Type 'never' errors in Supabase queries

Decision: Deploying /build-doctor
Reason: Build failures with 10+ errors need root cause diagnosis

Context for build-doctor:
- 47 TypeScript errors
- Recent migration changes
- Likely cause: Missing Supabase types

[Deploys /build-doctor which fixes the issue]
```

**Anti-Loop Mechanisms**:
- **Circuit Breaker**: Stops after 3 failed attempts with same agent
- **Context Preservation**: Creates summary before routing
- **Progress Monitoring**: Switches approach if no progress

**When to use**:
- ✅ Not sure which agent fits the problem
- ✅ Complex/ambiguous issues
- ✅ Want intelligent routing instead of guessing
- ❌ You already know which agent you need (use that agent directly)

---

### 0. `/build-doctor` - Build Diagnostics Specialist 🔴 **USE FIRST**

**Use whenever you encounter**:
- Build fails with 10+ errors
- TypeScript reports dozens/hundreds of errors
- "Whack-a-mole" fixing isn't working
- Before starting to fix errors one-by-one
- After pulling changes that break the build

**What it does**:
1. Runs `npm run build`, `npm run type-check`, `npm run lint`
2. **Groups errors by pattern** (not one-by-one)
3. **Identifies root causes** (e.g., missing Supabase types, outdated deps)
4. Prioritizes fixes by impact (high/medium/low)
5. **Recommends strategic fix order** (fix root cause, not symptoms)

**Example**:
```
You: "Build failing with 187 TypeScript errors after schema changes"

/build-doctor

Agent:
## BUILD DIAGNOSTIC REPORT

**Total Errors:** 187

### ROOT CAUSES

🔴 CRITICAL: Missing Supabase Types (162 errors, 87%)
- All Supabase queries return 'never'
- FIX: npm run db:types
- Impact: Fixes 162 errors instantly

🟡 MEDIUM: Multi-param handlers (18 errors, 10%)
- FIX: Refactor to standalone functions

🟢 LOW: ESLint quotes (7 errors, 4%)
- FIX: npm run lint -- --fix

RECOMMENDED STRATEGY:
1. Generate Supabase types ← START HERE (fixes 87%)
2. Then refactor handlers (fixes 10%)
3. Finally auto-fix ESLint (fixes 4%)
```

**Real-world impact**:
- ❌ Without Build Doctor: 3+ hours of whack-a-mole fixing, 200+ `@ts-ignore` comments
- ✅ With Build Doctor: 30 minutes, ONE command (`npm run db:types`) fixes 87% of errors

**Special focus**:
- Missing Supabase TypeScript types (most common root cause)
- Outdated dependencies
- Type inference failures
- Function signature mismatches

---

### 1. `/debugger` - Debugging Specialist

**Use whenever you encounter**:
- Errors in console/terminal
- Test failures
- Unexpected behavior
- TypeScript errors
- RLS policy issues

**What it does**:
1. Analyzes error messages and stack traces
2. Checks relevant source files
3. Identifies root cause
4. Provides exact fix with `file:line` references
5. Suggests prevention strategies

**Example**:
```
You: "I'm getting 'Cannot read property id of undefined' when fetching projects"

/debugger

Agent:
## Root Cause
projects variable is undefined because the Supabase query failed...

## Fix
lib/queries/projects.ts:42
- const projects = data.projects
+ const projects = data?.projects ?? []

## Verification
Add a test case for when Supabase returns null...
```

**Special focus**:
- Next.js 14 App Router issues (server/client boundaries)
- Supabase RLS policies (missing filters, auth context)
- React Query hydration mismatches
- TypeScript strict mode violations

---

### 2. `/database` - Supabase Migration Expert

**Use when**:
- Creating new tables
- Adding columns to existing tables
- Creating RLS policies
- Writing database queries
- Optimizing slow queries
- Adding indexes

**What it does**:
1. Generates timestamped migration files
2. Creates proper RLS policies
3. Adds indexes for performance
4. Includes rollback (DOWN) migration
5. Follows project naming conventions

**Example**:
```
You: "I need to create an 'rfis' table with project_id, number, title, description, status"

/database

Agent creates:
-- Migration: 20250121120000_create_rfis_table.sql
-- UP Migration
CREATE TABLE rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rfis_project_id ON rfis(project_id);
CREATE INDEX idx_rfis_status ON rfis(status);
CREATE UNIQUE INDEX idx_rfis_project_number ON rfis(project_id, number);

-- RLS Policies
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see RFIs in their projects" ON rfis FOR SELECT
  USING (project_id IN (SELECT user_project_ids(auth.uid())));
...

-- DOWN Migration
DROP TABLE IF EXISTS rfis CASCADE;
```

**Conventions it follows**:
- Table names: `snake_case`
- Indexes: `idx_table_column(s)`
- Multi-tenant scoping (org_id, project_id)
- Soft deletes (deleted_at)
- Audit triggers for critical tables

---

### 3. `/test-writer` - Testing Specialist

**Use when**:
- Writing new features (TDD)
- Fixing bugs (regression tests)
- Improving test coverage
- Writing E2E tests

**What it does**:
1. Writes unit tests (Vitest)
2. Writes component tests (React Testing Library)
3. Writes E2E tests (Playwright)
4. Mocks Supabase properly
5. Follows project test conventions

**Example**:
```
You: "Write tests for my createOrganization Server Action"

/test-writer

Agent creates:
// lib/actions/__tests__/organizations.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createOrganization } from '../organizations'

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({
        data: { id: '123', name: 'Test Org', slug: 'test-org' },
        error: null,
      }),
    })),
  }),
}))

describe('createOrganization', () => {
  it('should create organization with valid data', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Organization')

    const result = await createOrganization(formData)

    expect(result.data).toBeDefined()
    expect(result.data.name).toBe('Test Organization')
    expect(result.error).toBeNull()
  })

  it('should validate required fields', async () => {
    const formData = new FormData()
    // Missing name

    await expect(createOrganization(formData)).rejects.toThrow()
  })
})
```

**Coverage strategy**:
1. Critical paths first (auth, org/project creation)
2. Business logic (RFI routing, cost codes)
3. Edge cases (offline sync, errors)
4. UI components (forms, tables)

---

### 4. `/domain-validator` - Construction Domain Expert

**Use when**:
- Implementing construction workflows (RFIs, submittals, change orders)
- Choosing terminology/naming
- Validating data structures
- Ensuring industry compliance

**What it does**:
1. Validates construction terminology
2. Ensures workflows match industry standards
3. Checks data structures (CSI MasterFormat, AIA documents)
4. Flags compliance requirements
5. Suggests corrections

**Example**:
```
You: "I'm creating a 'document approval' feature"

/domain-validator

Agent responds:
## Validation Result
⚠️ Needs adjustment

## Industry Standard
This should be called "Submittal Approval Workflow"

In construction:
- Submittals are product data, shop drawings, or samples
- Workflow: Sub → GC → A/E → Owner
- Responses: Approved, Approved as Noted, Revise & Resubmit, Rejected
- Must track CSI MasterFormat section (e.g., Division 03 for concrete)

## Recommendations
1. Rename to "submittals" table
2. Add status enum: ['submitted', 'reviewed_by_gc', 'sent_to_ae', 'approved', 'rejected', 'revise_resubmit']
3. Add csi_section column (e.g., "03 30 00")
4. Add multi-stage review tracking

## References
- AIA Document G716 (Request for Information)
- CSI MasterFormat 2020
```

**What it validates**:
- RFI workflows (ball-in-court, SLA timers)
- Submittal workflows (multi-stage approval)
- Change order workflows (PCE → RFP → COR → CO)
- CSI MasterFormat structure
- AIA billing documents (G702/G703)

---

### 5. `/code-review` - Code Quality Reviewer

**Use when**:
- Before archiving an OpenSpec change
- Before creating a pull request
- After implementing a major feature
- When you want feedback

**What it does**:
1. Reads OpenSpec proposal and specs
2. Checks code against requirements
3. Reviews security (RLS, input validation)
4. Reviews performance
5. Reviews test coverage
6. Reviews conventions
7. Provides actionable feedback

**Example**:
```
You: "Review my add-rfi-workflow change before I archive it"

/code-review

Agent responds:
## 🟢 Strengths
- All spec requirements implemented
- RLS policies on all RFI tables
- Good test coverage (88%)
- Follows naming conventions

## 🟡 Suggestions
- [lib/queries/rfis.ts:42] Add index on (project_id, status) for better performance
- [components/rfi-form.tsx:10] Extract validation schema to lib/schemas/rfi.ts
- [e2e/rfis.spec.ts:50] Add test for offline RFI creation

## 🔴 Critical Issues
- [lib/actions/rfis.ts:100] Missing input validation on createRFI action
  Fix: Add Zod schema validation before Supabase insert

## 📋 Checklist Status
- ✅ Functionality: All requirements met
- ⚠️ Security: Add input validation (see above)
- ✅ Testing: Good coverage
- ✅ Performance: Queries optimized
- ✅ Documentation: tasks.md complete
```

**Review checklist**:
- Functionality (meets specs)
- Code quality (TypeScript, naming, DRY)
- Security (RLS, validation, no secrets)
- Performance (indexes, caching, memoization)
- Testing (coverage ≥80%)
- Documentation (comments, README)
- Conventions (from openspec/project.md)

---

### 6. `/performance` - Performance Auditor

**Use when**:
- Page loads slowly
- Database queries taking >100ms
- Large bundle sizes
- Before production launch
- Lighthouse score <90

**What it does**:
1. Analyzes database queries (EXPLAIN ANALYZE)
2. Checks for missing indexes
3. Identifies N+1 queries
4. Reviews React Query caching
5. Checks bundle size
6. Reviews component render performance
7. Suggests specific optimizations

**Example**:
```
You: "The project list page takes 3 seconds to load"

/performance

Agent responds:
## Performance Issues Found

### 🔴 Critical (>500ms impact)
- [lib/queries/projects.ts:42] Missing index on projects(org_id, status)
  Query takes 1,200ms for 500 projects
  Fix: CREATE INDEX idx_projects_org_status ON projects(org_id, status);

- [app/(dashboard)/[orgSlug]/projects/page.tsx:10] Loading all RFIs eagerly
  Causes N+1 query (1 query per project)
  Fix: Use JOIN to load in single query

### 🟡 Moderate (100-500ms impact)
- [components/project-card.tsx:50] Re-renders on every project list change
  Fix: Wrap with React.memo()

### 🟢 Minor (<100ms impact)
- [lib/utils/format.ts:20] formatCurrency called many times
  Fix: Memoize with useMemo

## Recommendations
1. Add database index (immediate)
2. Fix N+1 query with JOIN
3. Add React.memo to ProjectCard
4. Configure React Query staleTime

## Expected Impact
- Database: -1,000ms average query time
- Frontend: -500ms Time to Interactive
- Total: -1.5s page load time
```

**What it checks**:
- Database: Missing indexes, slow queries, RLS efficiency
- Frontend: React Query config, component renders, lazy loading
- Bundle: Analyze size, remove unused deps
- Lighthouse: FCP, LCP, TTI, CLS

---

## Integration with OpenSpec Workflow

### Complete Development Cycle

```
1. Create Proposal
   /openspec:proposal
   [Creates openspec/changes/add-feature/]

2. Validate Domain Logic
   /domain-validator
   [Ensures construction-correct terminology and workflows]

3. Implement Feature
   [Write code according to proposal]

   When you hit issues:
   - Errors? → /debugger
   - Need migration? → /database
   - Need tests? → /test-writer

4. Review Code
   /code-review
   [Checks quality, security, alignment with specs]

5. Optimize Performance
   /performance
   [If page is slow or before production]

6. Archive Change
   /openspec:archive
   [Moves to archive, updates specs/]
```

---

## Tips for Maximum Effectiveness

### ✅ Do This

- **Be specific**: "I'm getting TypeError on line 42 in rfis.ts" > "Something's broken"
- **Provide context**: Show error messages, code snippets, file paths
- **Chain commands**: Use `/debugger`, fix the issue, then `/test-writer` for regression test
- **Trust the agents**: They follow your project conventions (openspec/project.md)

### ❌ Avoid This

- Vague requests: "Make it faster" → Use "/performance" with specific page/query
- Skipping validation: Implement first, validate later → Validate domain logic early
- Not using `/debugger`: Spending 30 minutes debugging → Ask /debugger immediately
- Ignoring `/code-review`: Archiving without review → Always review before archiving

---

## Agent Command Map

**Quick decision tree**:

```
Do I have an error?
└─ YES → /debugger

Am I creating/modifying database?
└─ YES → /database

Am I writing/fixing tests?
└─ YES → /test-writer

Am I implementing construction workflow?
└─ YES → /domain-validator (validate first!)

Am I done with a change?
└─ YES → /code-review → /openspec:archive

Is something slow?
└─ YES → /performance
```

---

## Common Workflows

### Adding a New Feature (RFI Example)

```bash
1. /openspec:proposal
   "Add RFI workflow"

2. /domain-validator
   "Validate my RFI data model and workflow"

3. /database
   "Create rfis table with project_id, number, title, status, ball_in_court"

4. [Implement feature]

5. /test-writer
   "Write tests for RFI creation and status updates"

6. /debugger (if issues)
   "Getting RLS error when creating RFI"

7. /code-review
   "Review add-rfi-workflow before archiving"

8. /openspec:archive
   "Archive add-rfi-workflow"
```

### Debugging an Issue

```bash
1. /debugger
   "TypeError: Cannot read property 'id' of undefined in lib/queries/rfis.ts:42"

2. [Fix the issue]

3. /test-writer
   "Write regression test for the RFI query null case"
```

### Optimizing Performance

```bash
1. /performance
   "Project list page loads in 3 seconds"

2. /database
   "Create index on projects(org_id, status)"

3. [Implement other optimizations]

4. /performance
   "Re-analyze project list performance"
```

---

## Customization

Want to add more agents? Create `.claude/commands/your-agent.md`:

```markdown
---
name: Your Agent Name
description: What it does
category: Development
tags: [tag1, tag2]
---

[Agent instructions here]
```

Example custom agents you might add:
- **Cost Calculator**: CSI cost code calculations
- **Offline Sync**: IndexedDB and conflict resolution
- **Email Templates**: Construction-specific email formatting
- **Report Generator**: AIA forms and compliance reports

---

## Getting Help

- **Commands not showing?** Reload Claude Code
- **Agent not working correctly?** Check the agent file in `.claude/commands/`
- **Want to modify an agent?** Edit the `.md` file and reload Claude Code
- **Need a new agent?** Create new `.md` file in `.claude/commands/`

---

## Reference Files

- **This guide**: `.claude/README.md`
- **Full recommendations**: `RECOMMENDED_AGENTS_AND_SKILLS.md`
- **OpenSpec instructions**: `openspec/AGENTS.md`
- **Project conventions**: `openspec/project.md`
- **Design system**: `DESIGN_SYSTEM.md`

---

**Remember**: These agents are here to help you work faster and maintain quality. Don't hesitate to use them!
