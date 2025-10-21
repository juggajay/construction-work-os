# ✅ Build Doctor Agent Added

## What Was Created

### New Agent: `/build-doctor`

**File**: `.claude/commands/build-doctor.md`

**Purpose**: Diagnoses ROOT CAUSES of build failures instead of fixing symptoms one-by-one.

**Use When**:
- Build fails with 10+ errors
- TypeScript reports dozens/hundreds of errors
- "Whack-a-mole" fixing isn't working
- After pulling changes that break the build

---

## Real-World Example (The Lesson Learned)

### ❌ The Problem (What NOT to Do)

**Scenario**: 187 TypeScript errors after database schema changes

**Wrong Approach** (Whack-a-mole):
```typescript
// Adding @ts-ignore to every error
// @ts-ignore
const projects = await supabase.from('projects').select()
// @ts-ignore
console.log(projects[0].id)
// ... 185 more @ts-ignore comments
```

**Result**: 3+ hours wasted, 200+ `@ts-ignore` comments, no type safety

---

### ✅ The Solution (Root Cause Fix)

**Correct Approach** (Build Doctor):

1. Run `/build-doctor`
2. Agent identifies: **Missing Supabase Types** (162 errors, 87% of total)
3. Fix: `npm run db:types`
4. Result: 162 errors disappear instantly

**Result**: 30 minutes, ONE command, proper type safety

---

## How Build Doctor Works

### Step 1: Collect ALL Errors

```bash
npm run build 2>&1 | tee build.log
npm run type-check 2>&1 | tee types.log
npm run lint 2>&1 | tee lint.log
```

**Does NOT stop at first error** - collects everything.

### Step 2: Group by Pattern

Analyzes errors and groups:
- Missing Types (e.g., `Type 'never'`)
- Import Issues (e.g., `Cannot find module`)
- Function Signatures (e.g., `Expected 1 argument but got 2`)
- Null/Undefined Checks
- ESLint/Formatting

### Step 3: Identify Root Causes

**Common Root Causes** it checks for:

#### 🔴 CRITICAL: Missing Supabase Types
- **Symptoms**: 100+ `Type 'never'` errors
- **Fix**: `npm run db:types`
- **Impact**: Fixes 80-90% of type errors

#### 🔴 CRITICAL: Outdated Dependencies
- **Symptoms**: `Module not found`, conflicting types
- **Fix**: `rm -rf node_modules && npm install`

#### 🟡 MEDIUM: Type Inference Failures
- **Symptoms**: `Object is possibly 'null'` despite checks
- **Fix**: Add explicit type annotations or refactor

#### 🟢 LOW: ESLint/Formatting
- **Symptoms**: Quote style, missing semicolons
- **Fix**: `npm run lint -- --fix`

### Step 4: Recommend Strategy

Outputs prioritized fix order:
```markdown
## RECOMMENDED STRATEGY

1. Generate Supabase types ← START HERE (fixes 87%)
2. Then refactor multi-param handlers (fixes 10%)
3. Finally auto-fix ESLint (fixes 4%)

Expected Outcome:
- Step 1: Reduces errors from 187 → 25
- Step 2: Reduces errors from 25 → 7
- Step 3: Reduces errors from 7 → 0

Total Time: 15 minutes (vs. 3+ hours whack-a-mole)
```

---

## Your AI Dev Now Knows About It

Updated these files so AI dev sees Build Doctor immediately:

### 1. `CLAUDE.md` (AI sees automatically)
- Updated count: 9 → **10 agents**
- Listed `/build-doctor` **FIRST** with 🔴 USE FIRST flag

### 2. `README.md` (First place devs look)
- Added to Claude Code Commands table
- Marked with 🔴 USE FIRST flag

### 3. `AGENTS_QUICK_START.md` (Quick onboarding)
- Made Build Doctor **#1** in "Top Agents You'll Use"
- Explained why it's first: "Prevents wasting hours on whack-a-mole fixing"
- Updated All Agents table (9 → 10)

### 4. `.claude/README.md` (Comprehensive guide)
- Added detailed "### 0. `/build-doctor`" section
- Included real-world example (187 errors → 30 minutes)
- Explained what it does, when to use, expected impact

---

## How to Use

### When Build Fails

```bash
# ❌ DON'T do this:
# Start fixing errors one by one without understanding the pattern

# ✅ DO this:
# 1. Open Claude Code
# 2. Type: /build-doctor
# 3. AI runs diagnostics and identifies root causes
# 4. AI recommends strategic fix order
# 5. You fix root cause first, symptoms disappear
```

### Example Conversation

```
You: "Build is failing with 187 TypeScript errors"

AI: "I'll use /build-doctor to diagnose the root cause"

[Build Doctor Agent runs]

AI: "## ROOT CAUSE IDENTIFIED

🔴 CRITICAL: Missing Supabase Types (162 errors, 87%)

The TypeScript compiler doesn't have types for your Supabase schema.
All Supabase queries are returning 'never' type.

FIX:
npm run db:types

This will generate TypeScript types from your database schema
and eliminate 162 errors (87% of total).

After that, we'll handle the remaining 25 errors (multi-param
handlers and ESLint issues)."

You: "Do it"

AI: [Runs npm run db:types]

AI: "✅ Types generated. Errors reduced from 187 → 25.
Now let's fix the multi-param handlers..."
```

---

## Key Principles

1. **Collect first, fix second** - Don't stop at the first error
2. **Pattern recognition** - Group errors by similarity
3. **Root cause analysis** - Ask "why" not just "what"
4. **Impact prioritization** - Fix high-impact issues first
5. **Strategic fixes** - One root cause fix > 100 symptom fixes

---

## Special Checks for This Project

Build Doctor includes project-specific checks:

### Supabase Type Generation
```bash
# Check if types are stale
stat lib/types/supabase.ts
stat supabase/migrations/*.sql

# If migrations are newer, regenerate
npm run db:types
```

### Next.js App Router Issues
```bash
# Check for client/server boundary violations
grep -r "use client" app/
grep -r "use server" app/
```

### RLS Policy Errors
```bash
# Verify RLS is enabled
supabase db psql -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

---

## Success Criteria

After using Build Doctor + fixing root causes:

- [ ] `npm run build` completes without errors
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] **No `@ts-ignore` comments added**
- [ ] Types are properly inferred (no `any` types)

---

## Remember

**A good Build Doctor doesn't just fix errors—it understands WHY they exist and recommends the most efficient path forward.**

**That's the difference between 30 minutes and 3 hours of work.**

---

## Files Modified

✅ `.claude/commands/build-doctor.md` - **NEW** agent file
✅ `CLAUDE.md` - Updated agent count and list
✅ `README.md` - Added to commands table
✅ `AGENTS_QUICK_START.md` - Made #1 priority
✅ `.claude/README.md` - Added detailed section
✅ `BUILD_DOCTOR_AGENT_ADDED.md` - **THIS FILE** (summary)

Your AI dev will now use Build Doctor FIRST when encountering build failures! 🎉
