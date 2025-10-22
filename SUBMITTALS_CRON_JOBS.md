# Submittals Module - Cron Jobs Setup

This document describes the scheduled jobs required for the submittals module to function fully in production.

---

## Overview

Two cron jobs are required:
1. **Daily Review Reminders** - Send reminders for submittals pending review >7 days
2. **Procurement Deadline Alerts** - Alert project managers about overdue procurement deadlines

---

## Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

### Setup

1. Create API routes for each job:

```typescript
// app/api/cron/submittal-review-reminders/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Run the job
  await runReviewRemindersJob();

  return Response.json({ success: true });
}
```

2. Configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/submittal-review-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/procurement-deadline-alerts",
      "schedule": "0 8 * * *"
    }
  ]
}
```

3. Set environment variable:
```bash
vercel env add CRON_SECRET
```

---

## Option 2: Supabase pg_cron (Recommended for self-hosted)

### Setup

1. Enable pg_cron extension:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

2. Create job functions:

```sql
-- Review reminders job
CREATE OR REPLACE FUNCTION run_submittal_review_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Logic to send reminders
  -- (This would call an edge function or webhook)
  PERFORM net.http_post(
    url := 'https://your-domain.com/api/jobs/review-reminders',
    headers := '{"Authorization": "Bearer YOUR_SECRET"}'::jsonb
  );
END;
$$;

-- Schedule to run daily at 9 AM UTC
SELECT cron.schedule(
  'submittal-review-reminders',
  '0 9 * * *',
  'SELECT run_submittal_review_reminders();'
);
```

---

## Job 1: Daily Review Reminders

**Purpose:** Notify reviewers of submittals pending review for >7 days

**Schedule:** Daily at 9:00 AM (project timezone)

**Logic:**

```typescript
export async function runReviewRemindersJob() {
  const supabase = createClient();

  // Find submittals pending >7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: pendingSubmittals } = await supabase
    .from('submittals')
    .select(`
      id, number, title, project_id,
      current_reviewer_id,
      submitted_at,
      projects(name),
      reviewer:users!current_reviewer_id(email, full_name)
    `)
    .in('current_stage', ['gc_review', 'ae_review', 'owner_review'])
    .lt('submitted_at', sevenDaysAgo.toISOString())
    .is('deleted_at', null);

  // Send reminder emails
  for (const submittal of pendingSubmittals || []) {
    const daysPending = Math.floor(
      (Date.now() - new Date(submittal.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    await sendReviewReminderEmail(
      {
        email: submittal.reviewer.email,
        name: submittal.reviewer.full_name,
      },
      {
        submittalId: submittal.id,
        submittalNumber: submittal.number,
        submittalTitle: submittal.title,
        projectName: submittal.projects.name,
        projectUrl: `https://your-domain.com/projects/${submittal.project_id}/submittals/${submittal.id}`,
      },
      daysPending
    );
  }
}
```

---

## Job 2: Procurement Deadline Alerts

**Purpose:** Alert project managers about submittals past their procurement deadline

**Schedule:** Daily at 8:00 AM (project timezone)

**Logic:**

```typescript
export async function runProcurementDeadlineAlertsJob() {
  const supabase = createClient();

  const today = new Date().toISOString().split('T')[0];

  // Find overdue submittals grouped by project
  const { data: overdueSubmittals } = await supabase
    .from('submittals')
    .select(`
      id, number, title, spec_section,
      procurement_deadline,
      project_id,
      projects(name, org_id, organizations(name))
    `)
    .lt('procurement_deadline', today)
    .not('status', 'in', '(approved,approved_as_noted,rejected,cancelled)')
    .is('deleted_at', null);

  // Group by project
  const byProject = new Map();
  for (const submittal of overdueSubmittals || []) {
    if (!byProject.has(submittal.project_id)) {
      byProject.set(submittal.project_id, []);
    }
    byProject.get(submittal.project_id).push(submittal);
  }

  // Send one email per project to project managers
  for (const [projectId, submittals] of byProject) {
    const { data: managers } = await supabase
      .from('project_team_members')
      .select('user:users(email, full_name)')
      .eq('project_id', projectId)
      .eq('role', 'manager');

    for (const manager of managers || []) {
      await sendProcurementDeadlineAlert(
        {
          email: manager.user.email,
          name: manager.user.full_name,
        },
        submittals.map((s: any) => ({
          number: s.number,
          title: s.title,
          daysOverdue: Math.floor(
            (Date.now() - new Date(s.procurement_deadline).getTime()) / (1000 * 60 * 60 * 24)
          ),
          procurementDeadline: s.procurement_deadline,
        }))
      );
    }
  }
}
```

---

## Testing Cron Jobs Locally

1. Create test API routes:

```bash
curl http://localhost:3000/api/cron/submittal-review-reminders \
  -H "Authorization: Bearer your-test-secret"
```

2. Check console output for `[EMAIL STUB]` logs

3. Verify no errors in response

---

## Production Checklist

- [ ] Configure email service (SendGrid/Postmark/Resend)
- [ ] Set CRON_SECRET environment variable
- [ ] Deploy cron API routes
- [ ] Configure cron schedules (Vercel or pg_cron)
- [ ] Test each job manually in production
- [ ] Monitor job execution logs
- [ ] Set up alerting for job failures

---

## Monitoring

Monitor cron job execution:

```sql
-- View pg_cron job history (if using Supabase)
SELECT * FROM cron.job_run_details
WHERE jobname LIKE 'submittal-%'
ORDER BY start_time DESC
LIMIT 20;
```

Or use Vercel Cron dashboard:
- https://vercel.com/[your-team]/[your-project]/cron

---

## Troubleshooting

**Job not running:**
- Check cron schedule syntax
- Verify CRON_SECRET matches
- Check function permissions
- Review error logs

**Emails not sending:**
- Verify email service API keys
- Check email templates render correctly
- Review rate limits
- Check spam folder

---

**Last Updated:** 2025-01-23
