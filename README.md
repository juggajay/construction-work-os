# Construction Work OS

A construction-native Work OS designed to outperform generic tools for mid-market contractors. Built with Next.js, Supabase, and TypeScript.

## Features

- 🔐 **Authentication** - Email/password, magic links, password reset
- 🏢 **Multi-Tenancy** - Organizations and projects with role-based access control
- 🔒 **Row-Level Security** - Database-level data isolation
- 📝 **Audit Logging** - Immutable change tracking for compliance
- 📱 **Responsive Design** - Desktop, tablet, and mobile support
- ⚡ **Modern Stack** - Next.js 14, React 18, TypeScript, Tailwind CSS

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - Server components, streaming, React Server Actions
- **TypeScript** (strict mode) - Type safety across the stack
- **React Query v5** - Server state management and caching
- **shadcn/ui** - Accessible component library (Radix + Tailwind)
- **Tailwind CSS** - Utility-first styling

### Backend & Data
- **Supabase** - Postgres, Auth, Storage, Realtime subscriptions
- **Row-Level Security (RLS)** - Database-level access control
- **Postgres Triggers** - Automatic audit logging

### Testing
- **Vitest** - Unit and integration tests
- **Playwright** - End-to-end testing
- **React Testing Library** - Component testing

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Supabase account (or local Supabase via Docker)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/construction-work-os.git
cd construction-work-os
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

**For Local Development (Recommended)**:
```bash
cp .env.local.development .env.local
```

This uses safe local Supabase keys that only work on `localhost:54321`.

**For Production/Cloud Development**:
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase Cloud credentials
```

See `ENVIRONMENT_SETUP.md` for detailed environment configuration guide.

4. Run database migrations:

**Option A: Local Supabase (Recommended for Development)**
```bash
# Start local Supabase
npm run db:start

# Migrations are automatically applied
# Get local API keys
npm run db:status

# Update .env.local with the local Supabase URL and keys
```

**Option B: Supabase Cloud**
```bash
# Link to your cloud project
supabase link --project-ref your-project-ref

# Push migrations
npm run db:push
```

See `SUPABASE_CLI_GUIDE.md` for comprehensive Supabase CLI documentation.

5. (Optional) Seed development data:
```bash
npm run db:seed
```

This creates test users, organizations, and projects for local development. See `supabase/seed.sql` for login credentials (password: `password123`).

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

**Development**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

**Testing**
- `npm test` - Run unit tests (Vitest)
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run E2E tests (Playwright)
- `npm run test:e2e:ui` - Run E2E tests with UI

**Database** (Supabase CLI)
- `npm run db:start` - Start local Supabase
- `npm run db:stop` - Stop local Supabase
- `npm run db:reset` - Reset database (re-run migrations)
- `npm run db:seed` - Load development seed data (users, orgs, projects)
- `npm run db:status` - Show Supabase status and API keys
- `npm run db:migrate <name>` - Create new migration file
- `npm run db:types` - Generate TypeScript types from schema
- `npm run db:push` - Push migrations to production
- `npm run db:psql` - Open PostgreSQL shell

### Project Structure

```
construction-work-os/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup, etc.)
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   └── providers/         # Context providers
├── lib/                   # Shared utilities
│   ├── actions/           # Server Actions
│   ├── schemas/           # Zod validation schemas
│   ├── supabase/          # Supabase client & middleware
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   └── test-utils/        # Testing utilities
├── supabase/              # Database migrations & seed data
│   └── migrations/
├── e2e/                   # Playwright E2E tests
└── public/                # Static assets
```

### Database Schema

The application uses a multi-tenant architecture with the following core tables:

- `organizations` - Top-level tenant entities
- `projects` - Construction projects within organizations
- `organization_members` - User membership in organizations (owner/admin/member)
- `project_access` - User access to specific projects (manager/supervisor/viewer)
- `audit_logs` - Immutable audit trail of all changes

All tables have Row-Level Security (RLS) policies enforcing data isolation.

## Testing

### Unit Tests

Run unit tests with Vitest:
```bash
npm test
```

Generate coverage report:
```bash
npm run test:coverage
```

### E2E Tests

Run end-to-end tests with Playwright:
```bash
npm run test:e2e
```

Run with UI mode for debugging:
```bash
npm run test:e2e:ui
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

### Environment Variables for Production

- `NEXT_PUBLIC_APP_URL` - Your production URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Claude Code Commands

This project includes **11 custom AI agents** to accelerate development. If you're using Claude Code:

| Command | When to Use |
|---------|-------------|
| `/orchestrator` | **🟣 USE WHEN UNSURE** - Analyzes context, routes to right specialist |
| `/build-doctor` | **🔴 USE FIRST** when build fails (10+ errors) - Diagnoses root causes |
| `/debugger` | Any error, test failure, or bug |
| `/database` | Creating migrations, RLS policies, queries |
| `/test-writer` | Writing unit, integration, or E2E tests |
| `/domain-validator` | Validating construction workflows/terminology |
| `/code-review` | Before archiving changes or creating PRs |
| `/performance` | Optimizing slow queries or pages |
| `/openspec:proposal` | Creating new feature proposals |
| `/openspec:apply` | Implementing approved proposals |
| `/openspec:archive` | Archiving completed changes |

**📖 Full guide**: See `.claude/README.md` for detailed usage and examples.

**Quick start**: Type `/` in Claude Code to see all available commands.

## Contributing

1. Create a feature branch from `develop`
2. Make your changes following OpenSpec workflow (see `.claude/README.md`)
3. Use `/code-review` to validate your changes
4. Ensure all tests pass (`npm test` and `npm run test:e2e`)
5. Run type checking (`npm run type-check`)
6. Run linter (`npm run lint`)
7. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
