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
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run database migrations:

If using Supabase CLI:
```bash
supabase db push
```

Or manually run the migration files in `supabase/migrations/` in order:
- `20250120000000_initial_schema.sql`
- `20250120000001_rls_policies.sql`
- `20250120000002_audit_logging.sql`

5. (Optional) Seed development data:

First, create a user account via Supabase Auth, then run:
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/seed.sql
```

Or use the Supabase dashboard SQL editor to run `supabase/seed.sql`.

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests (Vitest)
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run E2E tests (Playwright)
- `npm run test:e2e:ui` - Run E2E tests with UI

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

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure all tests pass (`npm test` and `npm run test:e2e`)
4. Run type checking (`npm run type-check`)
5. Run linter (`npm run lint`)
6. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
