/**
 * RFI Overdue Email Template
 *
 * Sent when RFIs are overdue (used for both individual alerts and daily digests)
 */

import { baseEmailTemplate } from './base'

export interface OverdueRFI {
  rfiNumber: string
  rfiTitle: string
  dueDate: string
  daysOverdue: number
  priority: string
  viewUrl: string
}

export interface RFIOverdueEmailData {
  recipientName: string
  projectName?: string
  overdueRfis: OverdueRFI[]
  isDigest?: boolean
}

export function rfiOverdueTemplate(data: RFIOverdueEmailData): {
  subject: string
  html: string
  text: string
} {
  const { recipientName, projectName, overdueRfis, isDigest = false } = data

  const count = overdueRfis.length
  const subject = isDigest
    ? `Daily RFI Digest: ${count} Overdue RFI${count !== 1 ? 's' : ''}`
    : `RFI Overdue Alert: ${count} RFI${count !== 1 ? 's Need' : ' Needs'} Your Response`

  const introText = isDigest
    ? `You have <strong>${count} overdue RFI${count !== 1 ? 's' : ''}</strong> that require your attention.`
    : `The following RFI${count !== 1 ? 's are' : ' is'} overdue and require${count === 1 ? 's' : ''} your immediate attention.`

  const rfiListHtml = overdueRfis
    .map(
      (rfi) => `
    <div style="border: 1px solid #e5e5e5; border-left: 4px solid ${getPriorityColor(rfi.priority)}; padding: 16px; margin: 12px 0; border-radius: 4px; background-color: #ffffff;">
      <p style="margin: 0 0 8px 0;">
        <strong style="font-size: 16px;">${rfi.rfiNumber}: ${rfi.rfiTitle}</strong>
      </p>
      <p style="margin: 4px 0; font-size: 14px; color: #666;">
        <span style="color: #dc2626; font-weight: 600;">${rfi.daysOverdue} day${rfi.daysOverdue !== 1 ? 's' : ''} overdue</span>
        <span style="margin: 0 8px; color: #d1d5db;">•</span>
        Due: ${formatDate(rfi.dueDate)}
        <span style="margin: 0 8px; color: #d1d5db;">•</span>
        Priority: <span style="text-transform: uppercase; font-weight: 600; color: ${getPriorityColor(rfi.priority)};">${rfi.priority}</span>
      </p>
      <p style="margin: 12px 0 0 0;">
        <a href="${rfi.viewUrl}" style="color: #2563eb; text-decoration: none; font-weight: 500;">View RFI →</a>
      </p>
    </div>
  `
    )
    .join('')

  const html = baseEmailTemplate({
    title: isDigest ? `Daily Overdue RFI Digest` : `Overdue RFI Alert`,
    preheader: `You have ${count} overdue RFI${count !== 1 ? 's' : ''} requiring your attention`,
    content: `
      <p>Hi ${recipientName},</p>

      <p>${introText}${projectName ? ` on the <strong>${projectName}</strong> project` : ''}.</p>

      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #991b1b; font-weight: 600;">
          ⚠️ ${count} RFI${count !== 1 ? 's' : ''} Overdue
        </p>
      </div>

      ${rfiListHtml}

      <p style="margin-top: 24px;">Please review and respond to these RFIs as soon as possible to keep the project on track.</p>
    `,
    ctaUrl: undefined, // No single CTA for multi-RFI emails
    ctaText: undefined,
  })

  const text = `
${isDigest ? 'Daily Overdue RFI Digest' : 'Overdue RFI Alert'}

Hi ${recipientName},

${introText.replace(/<\/?strong>/g, '')}${projectName ? ` on the ${projectName} project` : ''}.

${overdueRfis
  .map(
    (rfi) => `
${rfi.rfiNumber}: ${rfi.rfiTitle}
  - ${rfi.daysOverdue} day${rfi.daysOverdue !== 1 ? 's' : ''} overdue
  - Due: ${formatDate(rfi.dueDate)}
  - Priority: ${rfi.priority.toUpperCase()}
  - View: ${rfi.viewUrl}
`
  )
  .join('\n')}

Please review and respond to these RFIs as soon as possible to keep the project on track.
  `.trim()

  return { subject, html, text }
}

function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'critical':
      return '#dc2626' // red
    case 'high':
      return '#ea580c' // orange
    case 'medium':
      return '#2563eb' // blue
    case 'low':
      return '#16a34a' // green
    default:
      return '#64748b' // gray
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
