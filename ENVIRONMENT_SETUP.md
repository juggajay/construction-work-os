# Environment Setup Guide

This guide explains how to configure environment variables for local development and production.

## Quick Setup (Local Development)

### 1. Start Local Supabase

```bash
npm run db:start
```

This starts a local Supabase instance with its own database, auth, and storage.

### 2. Copy Local Development Environment

```bash
cp .env.local.development .env.local
```

The `.env.local.development` file contains **safe default keys** for local Supabase that only work on `localhost:54321`.

### 3. Start Next.js

```bash
npm run dev
```

Your app will now connect to local Supabase at `http://localhost:54321`.

---

## Understanding Environment Files

| File | Purpose | Committed to Git? |
|------|---------|------------------|
| `.env.local.example` | Template with instructions | ✅ Yes |
| `.env.local.development` | **Ready-to-use** local config | ✅ Yes (safe local keys) |
| `.env.production.example` | Template for production | ✅ Yes |
| `.env.local` | **Active** local config | ❌ No (gitignored) |
| `.env.production` | **Active** production config | ❌ No (gitignored) |

---

## Local Development Keys (Safe to Commit)

These keys are **hard-coded defaults** in Supabase CLI and only work with your local instance:

```bash
# Local Supabase URL
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321

# Local anon key (safe - only works locally)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Local service role key (safe - only works locally)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

**Why these are safe:**
- They only authenticate against your local Supabase instance (`localhost:54321`)
- They don't work with your production database
- Every developer using Supabase CLI gets the same keys
- They're documented in Supabase's public documentation

---

## Production Keys (NEVER Commit)

Your **production keys** are unique to your Supabase Cloud project and must be kept secret.

### Where to Find Your Production Keys

1. Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/api
2. Copy your:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGc...`)
   - **Service Role Key** (starts with `eyJhbGc...`) - **NEVER expose this to the client!**

### Setting Up Production Keys Locally (Optional)

If you want to test against your **production database** from your local machine:

```bash
# Create .env.local with production keys
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-real-production-anon-key
```

**⚠️ Warning**: This connects your local app to your **production database**. Be careful!

---

## Deployment to Vercel (Production)

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   - `NEXT_PUBLIC_APP_URL` = `https://your-domain.com`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-production-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key` (if needed)

### Option 2: Via Vercel CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://your-project.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: your-production-anon-key
```

---

## Security Best Practices

### ✅ DO

- ✅ Use local Supabase for development (`npm run db:start`)
- ✅ Commit `.env.local.development` (has safe local keys)
- ✅ Use environment variables in Vercel/production
- ✅ Rotate keys if they're ever exposed
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only

### ❌ DON'T

- ❌ Commit `.env.local` or `.env.production` to git
- ❌ Share production keys publicly (Slack, Discord, etc.)
- ❌ Expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- ❌ Use production database for local development
- ❌ Hard-code keys in source code

---

## Common Scenarios

### Scenario 1: I'm a new developer joining the project

```bash
# 1. Clone the repo
git clone <repo-url>
cd construction-work-os

# 2. Install dependencies
npm install

# 3. Copy local dev environment
cp .env.local.development .env.local

# 4. Start local Supabase
npm run db:start

# 5. Start Next.js
npm run dev

# Done! You're using local Supabase with safe default keys.
```

### Scenario 2: I want to test against production data

```bash
# 1. Create .env.local with production keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# 2. Start Next.js
npm run dev

# Your app now connects to production database
# ⚠️ Be careful! You're working with real data.
```

### Scenario 3: Deploying to production

```bash
# 1. Push code to GitHub
git push origin main

# 2. Vercel auto-deploys (if connected)

# 3. Add environment variables in Vercel dashboard:
# Settings → Environment Variables
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Redeploy if needed
vercel --prod
```

---

## Troubleshooting

### Problem: "Invalid API key"

**Solution**: Check that you're using the right keys for your environment:
- Local Supabase → Use keys from `.env.local.development`
- Production → Use keys from Supabase dashboard

```bash
# Check which Supabase you're connected to
npm run db:status  # Shows local Supabase info

# Verify your .env.local
cat .env.local
```

### Problem: "Database connection failed"

**Solution**: Make sure local Supabase is running:
```bash
npm run db:status
# If not running:
npm run db:start
```

### Problem: "Can't see my production data locally"

**Solution**: You're probably connected to local Supabase. Check `.env.local`:
```bash
# Local Supabase (default)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321

# To connect to production, change to:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

---

## Key Differences: Local vs Production

| Aspect | Local Supabase | Production Supabase |
|--------|----------------|---------------------|
| **URL** | `http://localhost:54321` | `https://your-project.supabase.co` |
| **Data** | Test data (reset with `npm run db:reset`) | Real user data |
| **Keys** | Default (safe to commit) | Unique (secret) |
| **Performance** | Fast (local) | Network latency |
| **Studio** | `http://localhost:54323` | `https://app.supabase.com` |
| **Database** | `localhost:54322` | Cloud Postgres |

---

## Quick Reference

```bash
# Local Development
cp .env.local.development .env.local
npm run db:start
npm run dev

# Check Local Supabase
npm run db:status

# Reset Local Database
npm run db:reset

# Stop Local Supabase
npm run db:stop
```

---

## Related Documentation

- **Local Development**: `SUPABASE_CLI_GUIDE.md`
- **Quick Reference**: `SUPABASE_CLI_QUICK_REFERENCE.md`
- **Example Configs**: `.env.local.example`, `.env.production.example`
