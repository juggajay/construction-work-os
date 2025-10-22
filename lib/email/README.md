# RFI Email Integration

This directory contains email templates and services for RFI notifications.

## Setup

### 1. SendGrid Configuration

To enable email notifications, you need to configure SendGrid:

1. **Create a SendGrid account** (if you don't have one):
   - Visit https://signup.sendgrid.com/
   - Complete the sign-up process

2. **Generate an API key**:
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Give it a name (e.g., "Construction Work OS - RFI Notifications")
   - Select "Full Access" or "Restricted Access" with Mail Send permissions
   - Copy the API key (you'll only see it once!)

3. **Add environment variables**:
   Add these to your `.env.local` file:
   ```bash
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Verify sender email** (required by SendGrid):
   - Go to Settings > Sender Authentication
   - Verify a single sender email address OR
   - Set up domain authentication (recommended for production)

### 2. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SENDGRID_API_KEY` | Yes | Your SendGrid API key |
| `SENDGRID_FROM_EMAIL` | No | "From" email address (defaults to noreply@construction-work-os.com) |
| `NEXT_PUBLIC_APP_URL` | No | Your app URL for email links (defaults to http://localhost:3000) |
| `CRON_SECRET` | No | Secret token to protect cron endpoints in production |

### 3. Cron Job Setup (Production)

For the daily overdue digest, set up a cron job:

**Vercel** (recommended):
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/rfi-overdue-digest",
    "schedule": "0 9 * * *"
  }]
}
```

**Other platforms**:
Use your platform's cron service to hit `/api/cron/rfi-overdue-digest` daily.

Protect the endpoint by setting `CRON_SECRET` environment variable and configuring your cron service to send:
```
Authorization: Bearer your_cron_secret_here
```

## Email Types

### 1. Assignment Notification
**File**: `send-rfi-assignment.ts`
**Trigger**: When an RFI is submitted or reassigned
**Recipients**: Assigned user
**Content**: RFI title, description, due date, priority

### 2. Response Notification
**File**: `send-rfi-response.ts`
**Trigger**: When a response is added to an RFI
**Recipients**: RFI creator
**Content**: Response text, responder name, official answer indicator

### 3. Overdue Alert
**File**: `send-rfi-overdue.ts`
**Trigger**: Daily digest via cron job
**Recipients**: Users with overdue RFIs
**Content**: List of overdue RFIs with days overdue

## Testing

### Manual Testing

To test email functionality locally:

1. Set up SendGrid credentials in `.env.local`
2. Trigger an action that sends email (e.g., submit an RFI)
3. Check SendGrid dashboard > Activity to see sent emails
4. Check recipient's inbox

### Cron Job Testing

Test the overdue digest endpoint:

```bash
# Without authentication (local development)
curl http://localhost:3000/api/cron/rfi-overdue-digest

# With authentication (production)
curl -H "Authorization: Bearer your_cron_secret" \
     https://your-domain.com/api/cron/rfi-overdue-digest
```

## Graceful Degradation

Email functionality is optional. If `SENDGRID_API_KEY` is not set:
- The app will continue to function normally
- A warning will be logged: "Email not configured - skipping notification"
- Server actions will complete successfully without sending emails
- No errors are thrown to the user

This allows development and testing without email configuration.

## File Structure

```
lib/email/
├── client.ts                      # SendGrid client setup
├── templates/
│   ├── base.ts                    # Base HTML template
│   ├── rfi-assignment.tsx         # Assignment notification template
│   ├── rfi-response.tsx           # Response notification template
│   └── rfi-overdue.tsx            # Overdue alert template
├── send-rfi-assignment.ts         # Assignment email service
├── send-rfi-response.ts           # Response email service
└── send-rfi-overdue.ts            # Overdue email service
```

## Customization

### Email Templates

Templates are located in `lib/email/templates/`. To customize:

1. Edit the template functions to modify HTML/text content
2. Update the base template in `base.ts` for branding changes
3. Adjust colors via inline styles (email clients don't support CSS classes)

### Email Styling

The base template uses:
- Inline styles (required for email compatibility)
- Mobile-responsive design
- Dark mode support (where possible)
- 600px max width for readability

### SendGrid Features

Enabled features (in `client.ts`):
- Click tracking: Monitor link clicks
- Open tracking: Monitor email opens

To modify, edit `emailConfig` in `lib/email/client.ts`.
