/**
 * RFI Response Email Template
 *
 * Sent when someone adds a response to an RFI
 */

import { baseEmailTemplate } from './base'

export interface RFIResponseEmailData {
  rfiNumber: string
  rfiTitle: string
  responderName: string
  responseText: string
  isOfficialAnswer: boolean
  projectName: string
  viewUrl: string
}

export function rfiResponseTemplate(data: RFIResponseEmailData): {
  subject: string
  html: string
  text: string
} {
  const {
    rfiNumber,
    rfiTitle,
    responderName,
    responseText,
    isOfficialAnswer,
    projectName,
    viewUrl,
  } = data

  const answerBadge = isOfficialAnswer
    ? '<span style="background-color: #16a34a; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">OFFICIAL ANSWER</span>'
    : ''

  const subject = isOfficialAnswer
    ? `[RFI ${rfiNumber}] Official Answer Provided - ${rfiTitle}`
    : `[RFI ${rfiNumber}] New Response - ${rfiTitle}`

  const html = baseEmailTemplate({
    title: `New Response on RFI ${rfiNumber}`,
    preheader: `${responderName} has ${isOfficialAnswer ? 'provided an official answer' : 'responded'} to RFI ${rfiNumber}`,
    content: `
      <p>A new response has been added to an RFI on the <strong>${projectName}</strong> project.</p>

      <div class="meta-info">
        <p><strong>RFI Number:</strong> ${rfiNumber}</p>
        <p><strong>Title:</strong> ${rfiTitle}</p>
        <p><strong>Response From:</strong> ${responderName} ${answerBadge}</p>
      </div>

      ${
        isOfficialAnswer
          ? '<p style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; margin: 16px 0;"><strong>This is the official answer to the RFI.</strong> The RFI status has been updated to "Answered".</p>'
          : ''
      }

      <p><strong>Response:</strong></p>
      <p style="white-space: pre-wrap; background-color: #f9fafb; padding: 16px; border-radius: 4px;">${escapeHtml(responseText)}</p>

      <p style="margin-top: 24px;">Click the button below to view the full RFI thread and any attachments.</p>
    `,
    ctaUrl: viewUrl,
    ctaText: 'View RFI Thread',
  })

  const text = `
New Response on RFI ${rfiNumber}

A new response has been added to an RFI on the ${projectName} project.

RFI Number: ${rfiNumber}
Title: ${rfiTitle}
Response From: ${responderName}${isOfficialAnswer ? ' [OFFICIAL ANSWER]' : ''}

${isOfficialAnswer ? 'This is the official answer to the RFI. The RFI status has been updated to "Answered".\n' : ''}
Response:
${responseText}

View RFI Thread: ${viewUrl}
  `.trim()

  return { subject, html, text }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
