/**
 * RFI Assignment Email Template
 *
 * Sent when an RFI is assigned to a user or organization
 */

import { baseEmailTemplate } from './base'

export interface RFIAssignmentEmailData {
  rfiNumber: string
  rfiTitle: string
  rfiDescription: string
  assignedBy: string
  dueDate?: string
  priority: string
  projectName: string
  viewUrl: string
}

export function rfiAssignmentTemplate(data: RFIAssignmentEmailData): {
  subject: string
  html: string
  text: string
} {
  const {
    rfiNumber,
    rfiTitle,
    rfiDescription,
    assignedBy,
    dueDate,
    priority,
    projectName,
    viewUrl,
  } = data

  const subject = `[RFI ${rfiNumber}] ${rfiTitle} - Assigned to You`

  const html = baseEmailTemplate({
    title: `RFI ${rfiNumber} Assigned to You`,
    preheader: `${assignedBy} has assigned an RFI to you: ${rfiTitle}`,
    content: `
      <p>You have been assigned a new Request for Information (RFI) on the <strong>${projectName}</strong> project.</p>

      <div class="meta-info">
        <p><strong>RFI Number:</strong> ${rfiNumber}</p>
        <p><strong>Title:</strong> ${rfiTitle}</p>
        <p><strong>Priority:</strong> <span style="text-transform: uppercase; color: ${getPriorityColor(priority)};">${priority}</span></p>
        ${dueDate ? `<p><strong>Response Due:</strong> ${formatDate(dueDate)}</p>` : ''}
        <p><strong>Assigned By:</strong> ${assignedBy}</p>
      </div>

      <p><strong>Description:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(rfiDescription)}</p>

      <p style="margin-top: 24px;">Please review this RFI and provide your response as soon as possible.</p>
    `,
    ctaUrl: viewUrl,
    ctaText: 'View RFI',
  })

  const text = `
RFI ${rfiNumber} Assigned to You

You have been assigned a new Request for Information (RFI) on the ${projectName} project.

RFI Number: ${rfiNumber}
Title: ${rfiTitle}
Priority: ${priority.toUpperCase()}
${dueDate ? `Response Due: ${formatDate(dueDate)}` : ''}
Assigned By: ${assignedBy}

Description:
${rfiDescription}

Please review this RFI and provide your response as soon as possible.

View RFI: ${viewUrl}
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
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function escapeHtml(text: string): string {
  const div = { textContent: text } as any
  const textNode = { nodeValue: text }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
