/**
 * SendGrid Email Client Configuration
 *
 * This module initializes the SendGrid client and provides
 * a centralized place for email configuration.
 */

import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key from environment
const apiKey = process.env.SENDGRID_API_KEY
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@construction-work-os.com'

if (apiKey) {
  sgMail.setApiKey(apiKey)
} else {
  console.warn('SENDGRID_API_KEY not set - email functionality will be disabled')
}

export { sgMail, fromEmail }

/**
 * Check if email is configured and enabled
 */
export function isEmailEnabled(): boolean {
  return !!apiKey
}

/**
 * Configuration for SendGrid emails
 */
export const emailConfig = {
  from: fromEmail,
  replyTo: fromEmail,
  // Add tracking and other SendGrid features as needed
  trackingSettings: {
    clickTracking: { enable: true },
    openTracking: { enable: true },
  },
}
