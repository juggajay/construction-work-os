# Add Project Foundation

## Why

This is a greenfield construction Work OS project requiring foundational infrastructure before any construction-specific workflows (RFIs, submittals, etc.) can be built. Without a secure, multi-tenant architecture with proper authentication, authorization, and data isolation, subsequent features cannot safely operate in a production environment.

The construction industry demands audit-grade security and data segregation between organizations and projects due to contractual confidentiality, lien law compliance, and legal discovery requirements.

## What Changes

- Initialize Next.js 14 (App Router) project with TypeScript strict mode
- Configure Supabase project (Postgres, Auth, Storage, Realtime)
- Implement multi-tenant data model (orgs, projects, users, project_access)
- Set up Row-Level Security (RLS) policies with org_id + project_id scoping
- Create authentication flows (email/password, magic link, SSO foundation)
- Establish base API patterns (Server Actions, REST endpoints, Realtime subscriptions)
- Configure development tooling (ESLint, Prettier, Vitest, Playwright)
- Set up CI/CD pipeline (Vercel preview + production deploys)
- Add audit logging infrastructure (history tables via triggers)
- Create base UI layout (navigation, org/project switcher, responsive shell)

**New capabilities**: Authentication, Tenancy (multi-org/multi-project isolation)

## Impact

### Affected Specs
- **auth** (new): Authentication, authorization, RBAC, session management
- **tenancy** (new): Multi-tenant isolation, org/project membership, RLS policies

### Affected Code
- `/` (root): Next.js app initialization, package.json, tsconfig.json
- `/app` (new): App Router structure, layouts, middleware
- `/lib` (new): Shared utilities, Supabase client, types
- `/components` (new): Base UI components (shadcn/ui)
- `/supabase` (new): Migrations, seed data, RLS policies
- `/.github` (new): CI/CD workflows

### Dependencies Introduced
- `next@14.x`, `react@18.x`, `typescript@5.x`
- `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`
- `tailwindcss`, `@radix-ui/*`, `class-variance-authority` (shadcn/ui stack)
- `zod`, `react-hook-form`, `date-fns`
- `vitest`, `@testing-library/react`, `playwright`

### Timeline
- **Week 1**: Next.js setup, Supabase config, base schema, RLS policies
- **Week 2**: Auth flows UI, org/project creation, audit logging, CI/CD, testing infrastructure

### Risks
- **RLS complexity**: Postgres RLS can become slow with deep nesting; mitigate with indexed columns, precomputed membership tables, and SECURITY DEFINER helper functions.
- **Migration strategy**: Schema changes require careful coordination with seed data; mitigate with idempotent migrations and rollback scripts.
- **Supabase self-hosting**: Future enterprise customers may require self-hosted Supabase; ensure no cloud-only dependencies.
