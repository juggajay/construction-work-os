/**
 * Send RFI Assignment Email
 *
 * Sends an email notification when an RFI is assigned to a user
 */

'use server'

import { sgMail, fromEmail, emailConfig, isEmailEnabled } from './client'
import { rfiAssignmentTemplate, type RFIAssignmentEmailData } from './templates/rfi-assignment'

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
    console.warn('Email not configured - skipping RFI assignment notification')
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

    console.log(`RFI assignment email sent to ${to} for RFI ${input.rfiNumber}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send RFI assignment email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
