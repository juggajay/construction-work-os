# Project Context

## Purpose
Construction-native Work OS designed to outperform generic tools (monday.com) for mid-market contractors ($2–50M volume). Provides native RFIs, submittals, change orders, drawing/version control, offline field UX, and cost-code financials—without the complexity and cost of enterprise platforms like Procore.

**Target Users**: Mid-market general contractors and specialty trades (electrical, HVAC, plumbing, interiors) managing multiple small/medium projects (<$50M), needing fast time-to-value, offline reliability, and defensible audit trails.

**Core Value Propositions**:
- Construction-native workflows from day one (not generic boards)
- Field-first offline UX (gloves-friendly, bright-sunlight optimized)
- AI copilots embedded at all tiers (smart routing, compliance checks, risk prediction)
- Transparent project-based pricing (unlimited users per project)

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - Server components, streaming, React Server Actions
- **TypeScript** (strict mode) - Type safety across the stack
- **React Query v5** - Server state management, caching, optimistic updates
- **Zustand** - Lightweight client-side UI state
- **shadcn/ui** - Accessible component library (Radix + Tailwind)
- **Tailwind CSS** - Utility-first styling

### Backend & Data (Phase 1)
- **Supabase** - Postgres, Auth, Storage, Realtime subscriptions
  - Row-Level Security (RLS) with SECURITY DEFINER helpers
  - Indexed on: project_access, documents, rfis(project_id, status, due_date)
- **Postgres** - Relational core with JSONB for custom fields
- **Supabase Storage** - TUS resumable uploads via Uppy, CDN, thumbnails
- **Supabase Auth** - JWT-based with RBAC by org/project/trade

### Offline & Mobile
- **PWA** (Progressive Web App) - Service workers via Workbox
- **IndexedDB/Dexie** - Client-side structured storage
- **Offline sync** - Optimistic mutations + retry queue + conflict resolution
- **Uppy** - File upload with TUS resumable protocol

### Document Handling
- **React-PDF** (PDF.js workers) - Large PDF rendering (100MB+)
- **Konva or Fabric.js** - Canvas-based drawing markups and annotations
- **TanStack Table** - Virtualized tables for large datasets

### AI & Integrations
- **OpenAI API** - GPT-4 for RFI routing, spec Q&A, submittal compliance
- **QuickBooks Online API** - Financial export (initial)
- **Sage 100/300 adapters** - Accounting integration (roadmap)
- **Email-in/out** - RFI/submittal email workflows
- **OIDC/SAML** - SSO for Pro/Enterprise tiers

### Future Polyglot Persistence (Phase 2+)
- **Graph DB** (Neo4j/ArangoDB) - Dependencies, critical path, resource traversal
- **Event/Log stream** (Kafka/Redpanda) - CDC, audit analytics, realtime signals

## Project Conventions

### Code Style
- **TypeScript strict mode** enabled (`strict: true`, `noUncheckedIndexedAccess: true`)
- **ESLint** + **Prettier** for consistent formatting
- **File naming**: kebab-case for files/folders; PascalCase for components
- **Component structure**: Colocate tests, styles, and related files
- **Import order**: External → Internal → Relative → Types
- **Naming conventions**:
  - React components: PascalCase (e.g., `RfiForm.tsx`)
  - Utilities/hooks: camelCase (e.g., `useOfflineSync.ts`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
  - Database tables: snake_case (e.g., `rfi_responses`)

### Architecture Patterns
- **Spec-driven development**: All features start with OpenSpec proposals
- **Offline-first**: Optimistic updates, local-first mutations, background sync
- **Progressive enhancement**: Core workflows functional without JavaScript
- **Server components by default**: Client components only when interactivity required
- **CQRS-light**: Separate read/write paths for complex workflows (RFIs, submittals)
- **Immutable audit logs**: All state changes captured in history tables (Postgres triggers)
- **RLS everywhere**: Database-level security, no application-layer bypasses
- **API-first**: REST for CRUD, WebSockets (Realtime) for subscriptions, Server Actions for mutations

### Data Modeling Principles
- **Multi-tenancy**: org_id + project_id scoping on all tables
- **Soft deletes**: `deleted_at` timestamp (never hard delete for audit compliance)
- **Version control**: `version` column + history tables for documents, specs, contracts
- **Cost codes**: CSI MasterFormat hierarchy (division → section → item)
- **Status enums**: Use Postgres ENUMs for finite state machines (RFI status, submittal status)
- **JSONB custom fields**: Allow per-org custom attributes without schema migrations

### Testing Strategy
- **Unit tests**: Vitest for utilities, hooks, and pure functions
- **Component tests**: React Testing Library for UI logic
- **Integration tests**: Playwright for critical user flows (RFI submission, offline sync)
- **E2E tests**: Playwright for complete workflows (create project → close punch item)
- **Load tests**: k6 for large file uploads, concurrent users, offline queue replay
- **Coverage target**: 80% for core workflows (RFIs, submittals, change orders)
- **Test data**: Fixtures for construction domain (realistic project structures, cost codes)

### Git Workflow
- **Trunk-based development**: Short-lived feature branches (<2 days)
- **Branch naming**: `feature/add-rfi-routing`, `fix/offline-sync-conflict`, `refactor/pdf-viewer`
- **Commit conventions**: Conventional Commits (feat, fix, docs, refactor, test, chore)
- **PR requirements**:
  - OpenSpec proposal approved (for features/breaking changes)
  - All tests passing
  - No TypeScript errors (`tsc --noEmit`)
  - Code review from 1 engineer + 1 construction SME (for domain logic)
- **Deployment**: Preview deploys on Vercel for every PR; production deploys on merge to `main`

## Domain Context

### Construction Project Management Fundamentals
- **Project lifecycle**: Bid → Award → Preconstruction → Construction → Closeout → Warranty
- **Key roles**: Owner, General Contractor (GC), Subcontractors (subs), Architect/Engineer (A/E), Inspectors
- **Critical workflows**:
  - **RFIs (Requests for Information)**: Clarifications on drawings/specs; must track ball-in-court and SLA timers
  - **Submittals**: Product data, shop drawings, samples sent to A/E for approval before installation
  - **Change Orders**: Contract modifications for scope/cost/schedule changes (contemplated → proposed → approved)
  - **Daily Reports**: Weather, crew hours by trade, equipment, materials, incidents, progress photos
  - **Drawings/Specs**: 100+ MB PDFs, version control critical, hyperlinked sheets, on-plan markups
  - **Punch Lists**: Pre-closeout QA items, location-based, photo evidence, sign-off workflows
  - **AIA Billing**: G702 (Application for Payment), G703 (Continuation Sheet), retention tracking

### Cost Code Structure (CSI MasterFormat)
- **Division 01-14**: General Requirements → Conveying Equipment
- **Division 21-28**: Fire Suppression → Electronic Safety & Security
- **Division 31-33**: Earthwork → Utilities
- **Example**: `03 30 00` (Cast-in-Place Concrete) → `03 30 53` (Concrete Topping)

### Document Hierarchy
- **Contract Documents**: Agreement, General Conditions, Supplementary Conditions, Drawings, Specifications
- **Submittal logs**: CSI section-based, multi-stage reviews (GC → A/E → Owner)
- **RFI logs**: Sequential numbering per project, discipline tagging, linked to drawings/specs
- **Change Event logs**: Potential Change Orders (PCOs) → Change Order Requests (CORs) → executed COs

### Compliance & Audit Requirements
- **Retention periods**: 7 years for financial records, 10+ years for as-builts
- **Lien law compliance**: Preliminary notices, mechanics' liens, payment bond claims
- **OSHA recordkeeping**: Safety incidents, certifications, toolbox talks
- **Certified payroll**: Davis-Bacon prevailing wage for public projects
- **Immutable audit trails**: Who/what/when for all contract-impacting decisions

### Field Realities
- **Offline-first**: Job sites often lack reliable internet (cellular dead zones, trailer Wi-Fi)
- **Gloves-friendly UI**: Touch targets ≥48px, high contrast for sunlight readability
- **Photo-heavy**: 20-50 photos/day/user, need compression, geotag EXIF, automatic classification
- **Tablet-optimized**: 10" iPads and Android tablets (mid-range specs), not desktop-first
- **Voice input**: Hands-free RFI creation, daily log entries

## Important Constraints

### Performance Requirements
- **Large file handling**: PDFs up to 250MB, drawings with 100+ sheets
- **Drawing load time**: <2s on mid-range tablet for 50MB PDF
- **Offline sync**: Resume uploads from interruptions, queue 100+ pending mutations
- **Table virtualization**: Render 10,000+ RFI rows without lag
- **Photo compression**: Reduce 12MP photos to <500KB for sync efficiency

### Security & Compliance
- **Encryption**: TLS 1.3 in transit, AES-256 at rest (Supabase default)
- **RBAC**: Org admin, Project manager, Field supervisor, Subcontractor, Read-only roles
- **RLS policies**: All queries filtered by org_id + project_id + user role
- **Audit logs**: Immutable, timestamped, include IP/user agent for forensics
- **SOC 2 Type II**: Target within 18 months of GA
- **HIPAA BAA**: Optional for healthcare construction (Pro/Enterprise tier)

### Scalability Targets
- **Phase 1 (MVP)**: 100 concurrent users, 50 active projects, 10GB documents/project
- **Phase 2 (Year 1)**: 1,000 concurrent users, 500 active projects, 50GB documents/project
- **Phase 3 (Year 2)**: 10,000 concurrent users, portfolio-level analytics, graph DB for dependencies

### Budget & Timeline
- **12-week MVP**: Core workflows (RFIs, submittals, daily reports, change orders, drawings) + offline sync + AI v1
- **Weeks 1-2**: Repo setup, Supabase, auth/tenancy, base entities
- **Weeks 3-4**: File pipeline (TUS + Uppy), PDF viewer, photo capture
- **Weeks 5-6**: RFIs v1 (email-in, numbering, SLA timers), Submittals v1 (stages, CSI links)
- **Weeks 7-8**: Daily Reports, Punch/QA, Safety forms, offline end-to-end
- **Weeks 9-10**: Change Orders, AIA G702/703 exports, QuickBooks adapter
- **Weeks 11-12**: AI v1 (RFI routing, spec Q&A, submittal compliance), SSO, pilot on 2-3 real sites

### MVP Success Criteria
- **RFI turnaround**: ↓25% median response time vs baseline (email/spreadsheets)
- **Submittal cycle**: ↓20% median approval cycle vs baseline
- **Offline reliability**: >95% sync success rate on field tablets
- **Drawing performance**: <2s load time for 50MB PDFs on mid-range tablets
- **User adoption**: >70% weekly active field users after 2 weeks onboarding

## External Dependencies

### Core Services
- **Supabase** - Postgres, Auth, Storage, Realtime (self-hosted option for Enterprise)
- **Vercel** - Hosting, CDN, preview deploys (Edge Functions for global latency)
- **OpenAI API** - GPT-4 for AI copilots (fallback to Anthropic Claude if needed)

### Integrations (Phase 1)
- **QuickBooks Online API** - Export cost codes, invoices, payments
- **Sage 100 API** - Accounting sync for mid-market contractors (ODBC/REST)
- **Email (SendGrid/Postmark)** - Transactional emails, RFI/submittal notifications
- **SMS (Twilio)** - Critical alerts (RFI overdue, safety incident, punch item assigned)

### Integrations (Roadmap)
- **Autodesk Construction Cloud (ACC)** - BIM/Reviz model links, sheet sync
- **Procore API** - Migration tool for customers switching platforms
- **Raken API** - Daily report import for existing Raken users
- **Weather APIs** - NOAA/Weather.com for auto-populated daily report weather
- **Geocoding** - Google Maps/Mapbox for job site locations, geotagged photos

### Third-Party Libraries (Key Dependencies)
- **PDF.js** - PDF rendering (Mozilla, battle-tested)
- **Dexie.js** - IndexedDB wrapper with observable queries
- **Uppy** - File uploads with TUS resumable protocol
- **TanStack Table** - Headless table virtualization
- **date-fns** - Date manipulation (construction schedules are date-heavy)
- **Zod** - Runtime schema validation (API contracts, form validation)

### Monitoring & Observability
- **Sentry** - Error tracking, performance monitoring
- **PostHog** - Product analytics, feature flags, A/B testing
- **Vercel Analytics** - Web vitals, Core Web Vitals tracking
- **Supabase Logs** - Database query performance, RLS policy tracing
