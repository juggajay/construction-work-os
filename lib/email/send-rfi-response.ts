/**
 * Send RFI Response Email
 *
 * Sends an email notification when a response is added to an RFI
 */

'use server'

import { sgMail, fromEmail, emailConfig, isEmailEnabled } from './client'
import { rfiResponseTemplate, type RFIResponseEmailData } from './templates/rfi-response'

export interface SendRFIResponseEmailInput {
  to: string // Recipient email address (usually RFI creator)
  rfiNumber: string
  rfiTitle: string
  responderName: string
  responseText: string
  isOfficialAnswer: boolean
  projectName: string
  viewUrl: string // Direct link to RFI detail page
}

export async function sendRFIResponseEmail(
  input: SendRFIResponseEmailInput
): Promise<{ success: boolean; error?: string }> {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    console.warn('Email not configured - skipping RFI response notification')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const { to, ...templateData } = input

    // Generate email content from template
    const { subject, html, text } = rfiResponseTemplate(templateData)

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

    console.log(`RFI response email sent to ${to} for RFI ${input.rfiNumber}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send RFI response email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
