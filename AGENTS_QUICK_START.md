# Quick Start: Claude Code Agents

**Hey! Your project has 11 AI agents ready to help you code faster. Here's how to use them.**

---

## TL;DR - The Top Agents You'll Use

### 0. `/orchestrator` - 🟣 **NOT SURE WHICH AGENT? START HERE!**

```
You: "Something is broken but I'm not sure what"
Type: /orchestrator
Result: Analyzes context, figures out the problem type, deploys the right specialist
```

**Why it's first:** Prevents choosing wrong agent, losing context, or getting stuck in loops. It's your intelligent router.

### 1. `/build-doctor` - 🔴 **BUILD FAILS? START HERE!**

```
You: "Build failing with 187 TypeScript errors"
Type: /build-doctor
Result: Identifies root cause (missing Supabase types), fixes 87% of errors with ONE command
```

**Why it's first:** Prevents wasting hours on whack-a-mole fixing. Diagnoses root causes in 30 seconds.

### 2. `/debugger` - Hit a single error? Use this.

```
You: "I'm getting TypeError: Cannot read property 'id' of undefined"
Type: /debugger
Result: Exact fix with file:line number
```

### 3. `/database` - Need a migration or RLS policy?

```
You: "Create an 'rfis' table with project_id, title, status"
Type: /database
Result: Complete migration with RLS policies, indexes, triggers
```

### 3. `/test-writer` - Write tests automatically

```
You: "Write tests for createOrganization Server Action"
Type: /test-writer
Result: Complete Vitest test with mocks and edge cases
```

---

## How to Access

1. **Open Claude Code** in your project
2. **Type `/`** to see all commands
3. **Select a command** or type the full name (e.g., `/debugger`)

---

## Common Scenarios

### Scenario 1: You hit an error

```bash
❌ Problem: TypeError in console

✅ Solution:
1. Type: /debugger
2. Paste the error message
3. Get exact fix with file:line references
```

### Scenario 2: You're adding a new feature

```bash
1. Type: /openspec:proposal
   → Creates a spec-driven proposal

2. Type: /domain-validator
   → Ensures construction-correct workflows

3. Type: /database
   → Creates migrations and RLS policies

4. Code your feature

5. Type: /test-writer
   → Generates tests

6. Type: /code-review
   → Reviews code before archiving

7. Type: /openspec:archive
   → Archives completed change
```

### Scenario 3: Something is slow

```bash
❌ Problem: Page takes 3 seconds to load

✅ Solution:
1. Type: /performance
2. Describe what's slow: "Project list page"
3. Get specific optimizations with code examples
```

---

## All 11 Agents

| Priority | Command | Use When |
|----------|---------|----------|
| 🟣 **ROUTER** | `/orchestrator` | **Unsure which agent to use** - Analyzes context & routes to right specialist |
| 🔴 **FIRST** | `/build-doctor` | **Build fails with 10+ errors** - Use BEFORE debugging individual errors |
| 🔴 Daily | `/debugger` | Errors, bugs, unexpected behavior |
| 🔴 Daily | `/database` | Migrations, RLS, queries |
| 🔴 Daily | `/test-writer` | Writing tests |
| 🟡 Regular | `/domain-validator` | Construction workflows |
| 🟡 Regular | `/code-review` | Before archiving/PRs |
| 🟡 Regular | `/openspec:proposal` | New features |
| 🟡 Regular | `/openspec:apply` | Implementing features |
| 🟡 Regular | `/openspec:archive` | After deployment |
| 🔵 Optimize | `/performance` | Slow pages/queries |

---

## Pro Tips

✅ **Be specific**: "TypeError on line 42 in rfis.ts" > "Something broke"

✅ **Chain commands**: Use `/debugger` to fix, then `/test-writer` for regression test

✅ **Trust the agents**: They follow your project conventions (see `openspec/project.md`)

❌ **Don't waste time**: Stuck for 10 minutes? Ask `/debugger` immediately

---

## Need More Details?

📖 **Full guide**: `.claude/README.md` (comprehensive examples and workflows)

📖 **Advanced usage**: `RECOMMENDED_AGENTS_AND_SKILLS.md` (customization ideas)

---

## Can't See Commands?

1. Make sure you're using Claude Code (not regular Claude)
2. Reload the window (Cmd+R or Ctrl+R)
3. Type `/` and they should appear

---

**That's it! Start with `/debugger` next time you hit an error. You'll never go back to debugging alone.**
