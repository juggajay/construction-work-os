# ✅ Orchestrator Agent Added

## What Was Created

### New Meta Agent: `/orchestrator`

**File**: `.claude/commands/orchestrator.md`

**Purpose**: Intelligent routing agent that gathers context first, then deploys the RIGHT specialist for the job.

**Solves the problem of:**
- ❌ Using wrong agent for the task
- ❌ Getting stuck in infinite loops
- ❌ Losing context between agent calls
- ❌ Wasting time on wrong approach
- ❌ Not sure which agent to use

---

## How It Works

### The Orchestrator is NOT a Problem Solver

**The Orchestrator's ONLY job is:**
1. 📋 **Gather context** (check build, git, errors, state)
2. 🎯 **Diagnose problem type** (build failure? bug? database task?)
3. 🚀 **Route to specialist** (deploy the right agent)
4. 📦 **Provide full context** to that specialist
5. 👀 **Monitor progress** (switch if stuck)

---

## Example Scenarios

### Scenario 1: Ambiguous Request

```
User: "Something is broken"

Orchestrator:
1. Gathers context:
   - Runs: npm run build → FAILING (47 errors)
   - Checks: git log → Recent database migration
   - Analyzes: Type 'never' errors everywhere

2. Diagnoses:
   - Problem type: BUILD FAILURE
   - Error count: 47 (> 10 threshold)
   - Likely cause: Missing types

3. Routes:
   - Deploys: /build-doctor
   - Reason: Multiple errors need root cause diagnosis
   - Context: 47 errors, recent migration, type issues

4. Provides context:
   ## 🎯 ORCHESTRATOR ANALYSIS

   Context Gathered:
   - Build: FAILING (47 errors)
   - Recent: Database migration
   - Pattern: Type 'never' in Supabase queries

   Decision: Deploying /build-doctor

   [/build-doctor takes over and fixes it]
```

---

### Scenario 2: Wrong Agent Selected

```
User: "Create an RFI table"
AI tries: /debugger (WRONG!)

With Orchestrator:

Orchestrator:
1. Analyzes request:
   - Keywords: "create table" ✓
   - Task type: DATABASE SCHEMA CHANGE ✓

2. Routes correctly:
   - Deploys: /database (RIGHT!)
   - Reason: Table creation requires migration

3. Result:
   ✅ Database agent creates proper migration with RLS
```

---

### Scenario 3: Stuck in Loop

```
Without Orchestrator:
- Try fix 1 → Doesn't work
- Try fix 2 → Still broken
- Try fix 3 → Getting worse
- ... infinite loop ...

With Orchestrator (Circuit Breaker):

Attempt 1: Deploy /debugger → No progress
Attempt 2: Deploy /debugger with more context → Still stuck
Attempt 3: STOP and switch approach
  → Ask user for clarification
  → OR try different agent
  → OR suggest manual review

Result: ✅ Prevented infinite loop
```

---

## Decision Tree

The Orchestrator uses this logic:

```
┌────────────────────────────────────────────┐
│ Build failing with 10+ errors?            │
│   └─ YES → /build-doctor                  │
│                                            │
│ Database/migration task?                  │
│   └─ YES → /database                      │
│                                            │
│ Single error/bug?                         │
│   └─ YES → /debugger                      │
│                                            │
│ Performance issue?                        │
│   └─ YES → /performance                   │
│                                            │
│ Construction domain question?             │
│   └─ YES → /domain-validator              │
│                                            │
│ Code review needed?                       │
│   └─ YES → /code-review                   │
│                                            │
│ OpenSpec workflow?                        │
│   └─ YES → /openspec:*                    │
│                                            │
│ Exploration/research?                     │
│   └─ YES → Task (Explore agent)           │
│                                            │
│ Ambiguous?                                │
│   └─ Ask user for clarification           │
└────────────────────────────────────────────┘
```

---

## Anti-Loop Mechanisms

### 1. Circuit Breaker

```markdown
Attempt Counter:
- Attempt 1: Deploy specialist
- Attempt 2: Deploy with more context
- Attempt 3: STOP and change approach

If stuck after 3 attempts:
1. STOP trying same approach
2. Ask user for clarification
3. Suggest alternative paths
```

### 2. Context Preservation

Before routing, creates summary:

```markdown
## CONTEXT SUMMARY (for specialist)

**User Goal:**
What the user is trying to achieve

**Current State:**
- Files modified: [list]
- Errors present: [count]
- Build status: [passing/failing]

**What We've Tried:**
[Nothing yet / Previous attempts]

**Expected Outcome:**
[Clear success criteria]
```

### 3. Progress Monitoring

After deploying specialist:

**Success Signals** ✅:
- Problem solved
- Build passes
- Tests pass
- User satisfied

**Failure Signals** ❌:
- Same error after 3 attempts
- Specialist reports "can't fix"
- User says "that didn't work"

**Action on failure**: Switch agent or ask user

---

## Routing Table

Quick reference for which agent handles what:

| User Request | Deploy Agent | Reason |
|--------------|--------------|---------|
| "Build failing with 47 errors" | `/build-doctor` | 10+ errors = root cause needed |
| "TypeError in file.ts:42" | `/debugger` | Single specific error |
| "Create rfis table" | `/database` | Database schema change |
| "Write tests for createRFI" | `/test-writer` | Test creation |
| "Is RFI workflow correct?" | `/domain-validator` | Construction domain |
| "Review code before archiving" | `/code-review` | Code quality check |
| "Page loads in 3 seconds" | `/performance` | Performance issue |
| "Create proposal for RFIs" | `/openspec:proposal` | New feature spec |
| "How does auth work?" | Task (Explore) | Codebase exploration |
| "Something is broken" | AskUserQuestion | Needs clarification |

---

## When to Use Orchestrator

### ✅ USE Orchestrator When:

- **Unsure which agent to use**
  - "Something is broken but I don't know what"
  - "Not sure if this is a bug or build issue"

- **Complex/ambiguous problems**
  - Multiple possible root causes
  - Need to gather context first

- **Want intelligent routing**
  - Let AI figure out the right specialist
  - Prevent choosing wrong agent

- **Stuck in loops**
  - Same agent keeps failing
  - Need circuit breaker

### ❌ DON'T USE Orchestrator When:

- **You already know which agent you need**
  - "Build is failing" → Just use `/build-doctor`
  - "Create a table" → Just use `/database`

- **Simple, clear requests**
  - No ambiguity = no need for routing

---

## Key Features

### 1. Context-First Approach

Always gathers context BEFORE routing:

```bash
# Check build
npm run build 2>&1 | head -20

# Count errors
npm run build 2>&1 | grep -c "error"

# Recent changes
git log -1 --oneline
git status --short

# Supabase status
npm run db:status
```

### 2. Smart Decision Tree

Uses keywords and patterns to classify:
- Build failures (error count)
- Database tasks ("create table", "migration")
- Single bugs (TypeError, specific file:line)
- Performance ("slow", "optimize")
- Domain questions (RFI, submittal, CSI)

### 3. Full Context Handoff

Provides specialist with:
- **User's exact request**
- **Current state** (build, git, errors)
- **Relevant files** to check
- **Expected outcome**

### 4. Circuit Breaker

Prevents infinite loops:
- Tracks attempt count
- Stops after 3 failed attempts
- Switches to different approach

### 5. Progress Monitoring

Watches for:
- ✅ Success signals (problem solved)
- ❌ Failure signals (stuck, no progress)
- Switches agents if stuck

---

## Your AI Dev Now Knows About It

Updated **6 files** so AI dev knows about Orchestrator:

1. **`CLAUDE.md`** (AI sees automatically) - Listed as **Meta Agent** with 🟣 USE WHEN UNSURE
2. **`README.md`** - Added to commands table
3. **`AGENTS_QUICK_START.md`** - Made #0 agent (before build-doctor)
4. **`.claude/README.md`** - Full detailed section with examples
5. **`.claude/commands/orchestrator.md`** - **NEW** agent file (full logic)
6. **`ORCHESTRATOR_AGENT_ADDED.md`** - **THIS FILE** (summary)

---

## Real-World Impact

### Before Orchestrator:

```
User: "Something is broken"
AI: [Guesses /debugger]
AI: "Can't find the error"
User: "Still broken"
AI: [Tries /performance]
AI: "No performance issues found"
User: "STILL BROKEN!"
... 30 minutes wasted ...
```

### With Orchestrator:

```
User: "Something is broken"
AI: /orchestrator

Orchestrator:
- Checks build: FAILING (47 errors)
- Diagnoses: BUILD FAILURE
- Routes: /build-doctor
- Context: 47 errors after migration

/build-doctor:
- Root cause: Missing Supabase types
- Fix: npm run db:types
- Result: 47 → 0 errors

✅ Fixed in 2 minutes (vs. 30 minutes guessing)
```

---

## Summary

The Orchestrator is your **intelligent dispatcher**:

✅ **Gathers context first** (no guessing)
✅ **Routes to right specialist** (decision tree)
✅ **Preserves context** (full handoff)
✅ **Prevents loops** (circuit breaker)
✅ **Monitors progress** (switches if stuck)

**Use it when:**
- 🟣 Unsure which agent to use
- 🟣 Ambiguous problems
- 🟣 Want intelligent routing
- 🟣 Getting stuck in loops

**Your AI dev can now:**
- Analyze context before acting
- Deploy the right specialist every time
- Prevent wasted time on wrong approaches
- Recover from stuck situations

🎉 **No more guessing which agent to use!**
