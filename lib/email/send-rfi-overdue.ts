/**
 * Send RFI Overdue Email
 *
 * Sends an email notification for overdue RFIs
 * Can be used for both individual alerts and daily digests
 */

'use server'

import { sgMail, fromEmail, emailConfig, isEmailEnabled } from './client'
import { rfiOverdueTemplate, type RFIOverdueEmailData, type OverdueRFI } from './templates/rfi-overdue'
import { logger } from '@/lib/utils/logger'

export interface SendRFIOverdueEmailInput {
  to: string // Recipient email address
  recipientName: string
  projectName?: string
  overdueRfis: OverdueRFI[]
  isDigest?: boolean // true for daily digest, false for immediate alert
}

export async function sendRFIOverdueEmail(
  input: SendRFIOverdueEmailInput
): Promise<{ success: boolean; error?: string }> {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    logger.warn('Email not configured - skipping RFI overdue notification', {
      action: 'sendRFIOverdueEmail',
      to: input.to,
      rfiCount: input.overdueRfis.length,
    })
    return { success: false, error: 'Email not configured' }
  }

  // Don't send if there are no overdue RFIs
  if (input.overdueRfis.length === 0) {
    return { success: true } // Not an error, just nothing to send
  }

  try {
    const { to, ...templateData } = input

    // Generate email content from template
    const { subject, html, text } = rfiOverdueTemplate(templateData)

    // Send email via SendGrid
    await sgMail.send({
      to,
      from: emailConfig.from,
      replyTo: emailConfig.replyTo,
      subject,
      text,
      html,
      trackingSettings: emailConfig.trackingSettings,
    })

    const count = input.overdueRfis.length
    logger.info('RFI overdue email sent successfully', {
      action: 'sendRFIOverdueEmail',
      to,
      type: input.isDigest ? 'digest' : 'alert',
      rfiCount: count,
      projectName: input.projectName,
    })
    return { success: true }
  } catch (error) {
    logger.error('Failed to send RFI overdue email', error as Error, {
      action: 'sendRFIOverdueEmail',
      to: input.to,
      rfiCount: input.overdueRfis.length,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
