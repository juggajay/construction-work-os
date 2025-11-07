<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

# Available Claude Code Agents

This project has **11 custom slash commands** to help you work faster:

**Meta Agent** (intelligent routing):
- `/orchestrator` - **🟣 USE WHEN UNSURE** - Analyzes context, routes to right specialist, prevents loops

**Development Agents** (use these proactively):
- `/build-doctor` - **🔴 USE FIRST** when build fails - Diagnoses root causes, prevents whack-a-mole fixing
- `/debugger` - Debugging specialist (use when you hit errors)
- `/database` - Database/migration expert (use when creating tables/RLS)
- `/test-writer` - Testing specialist (use when writing tests)
- `/domain-validator` - Construction domain validator (use for construction workflows)
- `/code-review` - Code quality reviewer (use before archiving changes)
- `/performance` - Performance auditor (use when optimizing)

**OpenSpec Workflow**:
- `/openspec:proposal` - Create new change proposals
- `/openspec:apply` - Implement approved proposals
- `/openspec:archive` - Archive completed changes

**📖 Full documentation**: See `.claude/README.md` for detailed usage, examples, and workflows.

**Quick tip**: Type `/` to see all available commands, or read `AGENTS_QUICK_START.md` for a quick introduction.

---

# Supabase CLI Access

This project has **Supabase CLI installed and configured**. You can interact with the database directly:

**Quick Commands**:
- `npm run db:start` - Start local Supabase
- `npm run db:status` - Check status and get API keys
- `npm run db:migrate <name>` - Create new migration
- `npm run db:reset` - Apply migrations (resets database)
- `npm run db:types` - Generate TypeScript types
- `npm run db:psql` - Open PostgreSQL shell

**Documentation**:
- **Full guide**: `SUPABASE_CLI_GUIDE.md` (comprehensive Supabase CLI documentation)
- **Quick reference**: `SUPABASE_CLI_QUICK_REFERENCE.md` (cheat sheet)
- **Local Supabase URLs**: http://localhost:54321 (API), http://localhost:54323 (Studio)

**When to use**:
- Creating database migrations (use `/database` agent, which will use these commands)
- Testing SQL queries
- Debugging RLS policies
- Analyzing query performance
- Generating TypeScript types from schema

---

# Remote Database Migrations (Production)

**IMPORTANT**: To apply migrations to the remote Supabase database, you MUST use the Management API method.

**Read this first**: `SUPABASE_MIGRATION_GUIDE.md` (comprehensive guide with setup and exact commands)

**Quick Summary**:
- **Working Method**: `node scripts/apply-migrations-mgmt-api.js`
- **Configuration**: Set `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN` in `.env.local`
- **See**: `SUPABASE_MIGRATION_GUIDE.md` for complete environment variable setup

**Methods that DON'T work** (don't waste time trying):
- ❌ Direct PostgreSQL connection (timeout)
- ❌ Supabase CLI link (timeout)
- ❌ Port 6543 pooler (timeout)
- ❌ Supabase SDK exec_sql (function doesn't exist)

**Known Schema Differences** (remote vs local):
- User foreign keys may reference `auth.users` instead of `profiles`
- `change_order_approvals.rejection_reason` column doesn't exist in remote
- Always test queries against remote schema to avoid 400 errors

**When you encounter database errors**:
1. Check `SUPABASE_MIGRATION_GUIDE.md` for documented solutions
2. Remove problematic foreign key joins (user/profile references)
3. Verify column names exist in remote schema
4. Cast ENUMs to text in CASE/WHEN statements