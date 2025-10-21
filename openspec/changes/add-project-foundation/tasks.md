# Implementation Tasks

## 1. Project Initialization
- [ ] 1.1 Initialize Next.js 14 with `create-next-app` (App Router, TypeScript, Tailwind, ESLint)
- [ ] 1.2 Configure TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess: true`)
- [ ] 1.3 Set up Prettier with config file
- [ ] 1.4 Add `.editorconfig` for consistent formatting
- [ ] 1.5 Create `/lib`, `/components`, `/app/(auth)`, `/app/(dashboard)` directory structure
- [ ] 1.6 Add `package.json` scripts for dev, build, test, lint, type-check

## 2. Supabase Configuration
- [ ] 2.1 Create Supabase project (or use local with Docker for dev)
- [ ] 2.2 Install Supabase CLI (`supabase init`)
- [ ] 2.3 Configure environment variables (`.env.local` template)
- [ ] 2.4 Set up Supabase client (`/lib/supabase/client.ts`, `/lib/supabase/server.ts`)
- [ ] 2.5 Configure middleware with `await cookies()` (async) and `getClaims()` for fast session validation (no DB query)

## 3. Database Schema & Migrations
- [ ] 3.1 Create `organizations` table (id, name, slug, settings, created_at, updated_at)
- [ ] 3.2 Create `projects` table (id, org_id, name, number, address, status, budget, start_date, end_date, created_at, updated_at)
- [ ] 3.3 Create `profiles` table (extends Supabase auth.users with org-specific data)
- [ ] 3.4 Create `organization_members` table (org_id, user_id, role, invited_by, joined_at)
- [ ] 3.5 Create `project_access` table (project_id, user_id, role, trade, granted_by, granted_at)
- [ ] 3.6 Add indexes: `organizations(slug)`, `projects(org_id, status)`, `project_access(project_id, user_id)`
- [ ] 3.7 Create Postgres ENUMs: `org_role` (owner, admin, member), `project_role` (manager, supervisor, viewer)

## 4. Row-Level Security (RLS)
- [ ] 4.1 Enable RLS on all tables
- [ ] 4.2 Create helper function `user_org_ids(user_id)` to get accessible org IDs
- [ ] 4.3 Create helper function `user_project_ids(user_id)` to get accessible project IDs
- [ ] 4.4 Add RLS policies for `organizations` (users see only orgs they belong to)
- [ ] 4.5 Add RLS policies for `projects` (users see only projects in their orgs)
- [ ] 4.6 Add RLS policies for `organization_members` (org admins can manage, members can read)
- [ ] 4.7 Add RLS policies for `project_access` (project managers can grant access)
- [ ] 4.8 Test RLS policies with different user roles

## 5. Audit Logging
- [ ] 5.1 Create `audit_logs` table (id, table_name, record_id, action, old_values, new_values, user_id, ip_address, user_agent, timestamp)
- [ ] 5.2 Create Postgres trigger function `log_changes()` for INSERT/UPDATE/DELETE
- [ ] 5.3 Add triggers to `organizations`, `projects`, `organization_members`, `project_access`
- [ ] 5.4 Create `/lib/audit/log.ts` helper for application-level audit logs

## 6. Authentication Flows
- [ ] 6.1 Create sign-up page (`/app/(auth)/signup/page.tsx`)
- [ ] 6.2 Create login page (`/app/(auth)/login/page.tsx`)
- [ ] 6.3 Create magic link request page (`/app/(auth)/magic-link/page.tsx`)
- [ ] 6.4 Create password reset page (`/app/(auth)/reset-password/page.tsx`)
- [ ] 6.5 Create email confirmation page (`/app/(auth)/confirm/page.tsx`)
- [ ] 6.6 Add auth callback handler (`/app/auth/callback/route.ts`)
- [ ] 6.7 Implement logout functionality
- [ ] 6.8 Add protected route middleware (redirect unauthenticated users to /login)

## 7. Organization & Project Setup
- [ ] 7.1 Create org creation flow (`/app/(dashboard)/orgs/new/page.tsx`)
- [ ] 7.2 Create org switcher component (`/components/org-switcher.tsx`)
- [ ] 7.3 Create project creation form (`/app/(dashboard)/[orgSlug]/projects/new/page.tsx`)
- [ ] 7.4 Create project list view (`/app/(dashboard)/[orgSlug]/projects/page.tsx`)
- [ ] 7.5 Create project switcher component (`/components/project-switcher.tsx`)
- [ ] 7.6 Add org settings page (name, slug, member management)
- [ ] 7.7 Add project settings page (name, number, dates, budget, access control)

## 8. Base UI Components (shadcn/ui)
- [ ] 8.1 Initialize shadcn/ui with `npx shadcn-ui@latest init`
- [ ] 8.2 Add components: `button`, `input`, `label`, `form`, `card`, `dropdown-menu`, `dialog`, `avatar`, `badge`, `toast`
- [ ] 8.3 Create app shell layout (`/app/(dashboard)/layout.tsx`) with sidebar navigation
- [ ] 8.4 Create responsive header with org/project switchers
- [ ] 8.5 Add loading states (skeleton components)
- [ ] 8.6 Add error boundaries

## 9. API Patterns
- [ ] 9.1 Create Server Action patterns in `/lib/actions/` (orgs, projects, members)
- [ ] 9.2 Set up REST API routes in `/app/api/` (for external integrations)
- [ ] 9.3 Configure React Query provider with basic setup (defer complex SSR hydration to post-MVP; use simple initialData pattern)
- [ ] 9.4 Add Zod schemas for input validation (`/lib/schemas/`)
- [ ] 9.5 Create API error handling utilities

## 10. Testing Infrastructure
- [ ] 10.1 Configure Vitest (`vitest.config.ts`)
- [ ] 10.2 Set up React Testing Library with custom render function
- [ ] 10.3 Create test utilities for Supabase mocking (`/lib/test-utils/`)
- [ ] 10.4 Write unit tests for RLS helper functions
- [ ] 10.5 Configure Playwright (`playwright.config.ts`)
- [ ] 10.6 Write E2E tests for signup → create org → create project flow
- [ ] 10.7 Add test fixtures for orgs, projects, users

## 11. CI/CD Pipeline
- [ ] 11.1 Create GitHub Actions workflow for PR checks (lint, type-check, test)
- [ ] 11.2 Configure Vercel integration (preview deploys on PR)
- [ ] 11.3 Set up production deployment (merge to main)
- [ ] 11.4 Add environment variables to Vercel project
- [ ] 11.5 Configure Supabase connection pooling for serverless

## 12. Documentation & Seed Data
- [ ] 12.1 Write README.md with setup instructions
- [ ] 12.2 Create `.env.local.example` with all required variables
- [ ] 12.3 Add seed data script for dev environment (sample org, projects, users)
- [ ] 12.4 Document RLS policy patterns for future tables
- [ ] 12.5 Create architecture diagram (mermaid or excalidraw)
