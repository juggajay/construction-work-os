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

This project has **10 custom slash commands** to help you work faster:

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