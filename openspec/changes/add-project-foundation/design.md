# Design: Project Foundation

## Context

This is the foundational architecture for a construction-native Work OS competing with monday.com and Procore. The design must support:
- **Multi-tenancy**: Organizations own multiple projects; users belong to multiple orgs; projects have granular role-based access
- **Offline-first**: Field users need local-first data with optimistic updates and background sync
- **Audit compliance**: Construction legal requirements demand immutable, timestamped change logs
- **Scale constraints**: MVP targets 100 concurrent users, 50 projects, 10GB docs/project; Year 2 targets 10,000 users, portfolio analytics

Key stakeholders: GC project managers (desktop), field supervisors (tablet), subcontractors (mobile), architects (read-only).

## Goals / Non-Goals

### Goals
- Establish secure multi-tenant data model with database-level isolation (RLS)
- Provide scalable authentication supporting email/password, magic links, and future SSO
- Create org/project hierarchy with role-based access (org-level and project-level roles)
- Enable audit-grade logging for all state changes (who, what, when, IP, user-agent)
- Set up CI/CD pipeline with preview deploys and automated testing
- Lay foundation for offline sync (optimistic updates, conflict resolution)
- Establish API patterns (Server Actions, REST, Realtime) for future workflows

### Non-Goals
- Offline sync implementation (deferred to Weeks 7-8 with IndexedDB/Dexie)
- Advanced SSO/SAML (foundation only; full implementation in Pro/Enterprise tier)
- Graph DB integration (deferred to Phase 2+ for dependencies)
- Mobile-specific UI (responsive web, but tablet optimizations come in workflow-specific changes)
- BIM/model integrations (deferred to post-MVP roadmap)

## Decisions

### 1. Multi-Tenancy Model: Org → Project → Access
**Decision**: Two-level hierarchy: organizations own projects; users have org-level roles (owner/admin/member) and project-level roles (manager/supervisor/viewer).

**Rationale**:
- Construction firms (orgs) manage multiple projects simultaneously
- Subcontractors need access to specific projects without seeing all org data
- Enables per-project billing (pricing model: $299/project/month)
- Supports future portfolio-level analytics at org scope

**Schema**:
```sql
organizations (id, name, slug, settings)
projects (id, org_id, name, number, address, status, budget, dates)
organization_members (org_id, user_id, role: owner|admin|member)
project_access (project_id, user_id, role: manager|supervisor|viewer, trade)
```

**Alternatives considered**:
- Flat project-only tenancy (rejected: no org-level settings, billing complexity)
- Three-level org → portfolio → project (rejected: over-engineered for mid-market)

### 2. Row-Level Security (RLS) Over Application-Layer Authorization
**Decision**: Use Postgres RLS policies on all tables, enforced at database level. Application layer only handles UI logic and API input validation.

**Rationale**:
- **Security**: Even if application code has bugs, database rejects unauthorized queries
- **Consistency**: Single source of truth for access control (no drift between API routes, Server Actions, and direct queries)
- **Audit compliance**: Database logs all denied access attempts automatically
- **Supabase integration**: RLS is first-class in Supabase with JWT claim injection

**Pattern**:
```sql
-- Helper function (cached per transaction)
CREATE OR REPLACE FUNCTION user_project_ids(user_uuid UUID)
RETURNS TABLE(project_id UUID) AS $$
  SELECT DISTINCT p.id
  FROM projects p
  INNER JOIN organization_members om ON om.org_id = p.org_id
  WHERE om.user_id = user_uuid
  UNION
  SELECT pa.project_id
  FROM project_access pa
  WHERE pa.user_id = user_uuid
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- RLS policy on projects table
CREATE POLICY "Users see only their projects"
  ON projects FOR SELECT
  USING (id IN (SELECT user_project_ids(auth.uid())));
```

**Performance**: Index `organization_members(user_id, org_id)` and `project_access(user_id, project_id)`. If slow at scale, precompute memberships in `user_project_memberships` materialized view.

**Important**: Always add explicit filters (e.g., `.eq('user_id', userId)`, `.filter()`) to queries even when RLS policies are active. While RLS provides security, explicit filters allow Postgres to construct more efficient query plans, significantly improving performance. RLS policies act as implicit WHERE clauses but don't help the query planner optimize execution.

**Alternatives considered**:
- Application-layer checks (rejected: error-prone, no defense-in-depth)
- Custom authorization middleware (rejected: redundant with RLS, harder to audit)

### 3. Audit Logging via Postgres Triggers
**Decision**: Use Postgres triggers to capture INSERT/UPDATE/DELETE on critical tables, writing to `audit_logs` table with old/new JSONB values.

**Rationale**:
- **Immutability**: Triggers run in same transaction as change, guaranteed consistency
- **Construction compliance**: Contracts require "who changed what and when" for RFIs, change orders, drawings
- **Legal discovery**: Audit logs admissible as business records in litigation
- **Performance**: Async writes to `audit_logs` avoid blocking user transactions (use AFTER triggers)

**Schema**:
```sql
audit_logs (
  id, table_name, record_id, action (INSERT|UPDATE|DELETE),
  old_values JSONB, new_values JSONB,
  user_id, ip_address, user_agent, timestamp
)
```

**Trigger pattern**:
```sql
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id, timestamp)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Alternatives considered**:
- Application-layer logging (rejected: can be bypassed, not transactional)
- Write-ahead log (WAL) streaming (deferred to Phase 2+ for CDC/analytics)

### 4. Authentication: Supabase Auth with Email + Magic Link (SSO Foundation)
**Decision**: Use Supabase Auth (GoTrue) for MVP with email/password and magic links. Add SSO (OIDC) foundation but gate full SAML/Okta behind Pro/Enterprise tiers.

**Rationale**:
- **Speed**: Supabase Auth is production-ready with JWT, RLS integration, and email templates
- **Cost**: Self-hosting available for enterprise customers requiring on-premise
- **Extensibility**: OIDC support for Google, Microsoft SSO (common in construction tech stacks)

**Auth flow**:
1. User signs up with email → Supabase sends confirmation email → email verified
2. User belongs to 0 orgs → forced to create/join org on first login
3. Org invite flow: Admin invites email → pre-provisioned `organization_members` row → user accepts invite

**Session management**:
- Server-side cookies (httpOnly, secure, sameSite=lax) via `@supabase/ssr`
- Middleware refreshes session on every request (sliding window) using `supabase.auth.getClaims()` for fast validation (no DB round-trip)
- Use `getClaims()` instead of `getUser()` in middleware for performance (validates JWT only, no Supabase database query)
- Use `getUser()` in protected routes/Server Actions when you need full user data (makes database request to Supabase Auth)
- 1-hour access token TTL, 7-day refresh token TTL
- **Note**: `cookies()` API in Next.js 15+ requires `await` (async)

**Alternatives considered**:
- NextAuth.js (rejected: less integrated with Supabase RLS, no magic links by default)
- Auth0 (rejected: cost, overkill for MVP, vendor lock-in)

### 5. API Patterns: Server Actions for Mutations, React Query for Reads
**Decision**:
- **Mutations**: Next.js Server Actions (progressive enhancement, automatic revalidation)
- **Reads**: React Query (client-side caching, stale-while-revalidate, optimistic updates)
- **Realtime**: Supabase Realtime subscriptions for collaborative features (RFI comments, drawing markups)

**Rationale**:
- **Server Actions**: Zero-bundle-size, CSRF-protected, support progressive enhancement (works without JS)
- **React Query**: Best-in-class caching, deduplication, background refetching, offline support (pairs with IndexedDB later)
- **Separation**: Mutations change state (Server Actions), reads display state (React Query)

**Example**:
```tsx
// Server Action (mutations)
'use server'
export async function createProject(formData: FormData) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({ name: formData.get('name'), org_id: formData.get('org_id') })
    .select()
  revalidatePath('/[orgSlug]/projects')
  return { data, error }
}

// React Query (reads)
const { data: projects } = useQuery({
  queryKey: ['projects', orgId],
  queryFn: async () => {
    const { data } = await supabase.from('projects').select('*').eq('org_id', orgId)
    return data
  },
  staleTime: 60_000,
})
```

**Alternatives considered**:
- tRPC (rejected: overkill for MVP, less progressive enhancement)
- REST-only (rejected: no type safety, verbose)

### 6. Development Tooling: TypeScript Strict + ESLint + Vitest + Playwright
**Decision**: Enforce strict TypeScript, ESLint with Next.js config, Vitest for unit tests, Playwright for E2E tests.

**Rationale**:
- **TypeScript strict**: Catch bugs at compile time (null checks, index access, `any` bans)
- **Vitest**: Fast, ESM-native, compatible with Next.js (replaces Jest)
- **Playwright**: Cross-browser, mobile emulation, headed/headless modes, network mocking

**CI checks** (run on every PR):
1. `pnpm lint` (ESLint)
2. `pnpm type-check` (tsc --noEmit)
3. `pnpm test` (Vitest unit + integration tests)
4. `pnpm test:e2e` (Playwright E2E tests)

**Alternatives considered**:
- Jest (replaced by Vitest for speed, ESM)
- Cypress (replaced by Playwright for better mobile emulation)

## Risks / Trade-offs

### Risk: RLS Performance at Scale
**Scenario**: Complex RLS policies with deep joins (user → org_members → projects) slow down queries at 1,000+ projects/user.

**Mitigation**:
1. Index all RLS predicate columns: `organization_members(user_id, org_id)`, `project_access(user_id, project_id)`
2. Use SECURITY DEFINER helper functions to cache results per transaction (e.g., `user_project_ids()`)
3. If still slow, precompute `user_project_memberships` materialized view, refreshed on membership changes

**Rollback**: If RLS proves unworkable, fall back to application-layer checks with pessimistic locking.

### Risk: Supabase Vendor Lock-in
**Scenario**: Supabase pricing increases or service quality degrades; customers demand self-hosting.

**Mitigation**:
1. Supabase is open-source (can self-host with Docker Compose)
2. Use standard Postgres features (RLS, triggers, JSONB) — portable to managed Postgres (RDS, Neon, Crunchy)
3. Supabase client library is thin wrapper over `pg` — easy to replace with raw Postgres driver

**Rollback**: Migrate to Neon (serverless Postgres) + custom auth (Lucia, better-auth).

### Risk: Offline Sync Complexity
**Scenario**: Optimistic updates conflict with server state, causing data loss or inconsistent UI.

**Mitigation** (deferred to Weeks 7-8):
1. Use versioning (optimistic lock with `version` column)
2. Last-write-wins for non-critical fields (e.g., draft notes)
3. User-visible conflict resolution for critical fields (e.g., change order amounts)
4. Immutable history tables allow rollback and forensic analysis

**Trade-off**: MVP skips offline sync to reduce scope; added in Weeks 7-8 after core workflows proven.

### Trade-off: Server Actions vs REST
**Chosen**: Server Actions for mutations.

**Pro**: Zero bundle size, progressive enhancement, CSRF protection, automatic revalidation.

**Con**: Less compatible with external API consumers (mobile apps, integrations).

**Mitigation**: Expose parallel REST API at `/app/api/v1/*` for external integrations (QuickBooks, Sage, mobile apps). Server Actions for web app only.

## Migration Plan

### Phase 1: Initial Schema (Week 1)
1. Run migration `20250120_initial_schema.sql` (orgs, projects, members, access, audit_logs)
2. Seed dev data with `seed.sql` (1 org, 3 projects, 5 users with different roles)
3. Test RLS policies with integration tests (user A cannot see user B's org)

### Phase 2: Auth Flow (Week 1-2)
1. Deploy Supabase Auth email templates (signup confirmation, magic link, password reset)
2. Test signup → confirmation → create org → create project → invite user flow (E2E)

### Phase 3: Production Deploy (Week 2)
1. Create Vercel project, link to GitHub repo
2. Set environment variables in Vercel (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
3. Deploy to production (vercel.com/jayso/construction-work-os)
4. Test with 2-3 pilot users (internal team)

### Rollback Strategy
- Migrations include `DOWN` SQL for rollback (e.g., `DROP TABLE IF EXISTS projects CASCADE`)
- Vercel instant rollback to previous deployment via UI
- Database point-in-time recovery (Supabase supports 7-day PITR on Pro plan)

## Open Questions

1. **Org slug uniqueness**: Global uniqueness (like GitHub) or per-org (like Slack workspaces)?
   **Answer**: Global uniqueness for clean URLs (`app.example.com/acme-construction`). Reserve common slugs (`admin`, `api`, `docs`).

2. **Project number format**: Auto-increment integer or custom format (e.g., `2025-001`)?
   **Answer**: Support both. Default auto-increment (`P-00001`), allow org-level custom format in `organizations.settings.project_number_format`.

3. **Role hierarchy**: Can org owners auto-access all projects, or explicit grant required?
   **Answer**: Org owners and admins auto-access all projects in their org (implicit via RLS). Project-level roles override for subcontractors (explicit grant only).

4. **Audit log retention**: How long to keep audit logs? Compliance requirement?
   **Answer**: 10 years (construction industry standard for as-builts). Implement soft-delete on `audit_logs` with `archived_at` timestamp. Move to cold storage (S3 Glacier) after 2 years.

5. **Supabase connection pooling**: PgBouncer config for serverless?
   **Answer**: Use Supabase's built-in PgBouncer (transaction mode). Set `pool_size = 15` for Vercel (serverless, many cold starts). Monitor with Supabase dashboard.
