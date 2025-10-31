/**
 * Send RFI Assignment Email
 *
 * Sends an email notification when an RFI is assigned to a user
 */

'use server'

import { sgMail, fromEmail, emailConfig, isEmailEnabled } from './client'
import { rfiAssignmentTemplate, type RFIAssignmentEmailData } from './templates/rfi-assignment'
import { logger } from '@/lib/utils/logger'

export interface SendRFIAssignmentEmailInput {
  to: string // Recipient email address
  rfiNumber: string
  rfiTitle: string
  rfiDescription: string
  assignedBy: string // Name of person who assigned
  dueDate?: string // ISO date string
  priority: string
  projectName: string
  viewUrl: string // Direct link to RFI detail page
}

export async function sendRFIAssignmentEmail(
  input: SendRFIAssignmentEmailInput
): Promise<{ success: boolean; error?: string }> {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    logger.warn('Email not configured - skipping RFI assignment notification', {
      action: 'sendRFIAssignmentEmail',
      to: input.to,
      rfiNumber: input.rfiNumber,
    })
    return { success: false, error: 'Email not configured' }
  }

  try {
    const { to, ...templateData } = input

    // Generate email content from template
    const { subject, html, text } = rfiAssignmentTemplate(templateData)

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

    logger.info('RFI assignment email sent successfully', {
      action: 'sendRFIAssignmentEmail',
      to,
      rfiNumber: input.rfiNumber,
      projectName: input.projectName,
    })
    return { success: true }
  } catch (error) {
    logger.error('Failed to send RFI assignment email', error as Error, {
      action: 'sendRFIAssignmentEmail',
      to: input.to,
      rfiNumber: input.rfiNumber,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
