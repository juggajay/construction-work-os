/**
 * SLA (Service Level Agreement) Calculation Utilities
 * Calculate response times, overdue status, and SLA compliance metrics
 */

export type RFIForSLA = {
  status: string
  submitted_at: string | null
  response_due_date: string | null
  answered_at: string | null
  closed_at: string | null
}

/**
 * Check if an RFI is overdue
 */
export function isOverdue(rfi: RFIForSLA): boolean {
  // Closed and cancelled RFIs are never overdue
  if (rfi.status === 'closed' || rfi.status === 'cancelled') {
    return false
  }

  // Draft RFIs don't have due dates
  if (rfi.status === 'draft' || !rfi.response_due_date) {
    return false
  }

  // If answered, check if it was answered after the due date
  if (rfi.answered_at) {
    return new Date(rfi.answered_at) > new Date(rfi.response_due_date)
  }

  // Otherwise, check if current time is past due date
  return new Date() > new Date(rfi.response_due_date)
}

/**
 * Calculate days overdue
 */
export function getDaysOverdue(rfi: RFIForSLA): number {
  if (!isOverdue(rfi) || !rfi.response_due_date) {
    return 0
  }

  const dueDate = new Date(rfi.response_due_date)
  const compareDate = rfi.answered_at ? new Date(rfi.answered_at) : new Date()

  const diffMs = compareDate.getTime() - dueDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Calculate actual response time in hours
 */
export function calculateResponseTime(rfi: RFIForSLA): number | null {
  if (!rfi.submitted_at || !rfi.answered_at) {
    return null
  }

  const submittedDate = new Date(rfi.submitted_at)
  const answeredDate = new Date(rfi.answered_at)

  const diffMs = answeredDate.getTime() - submittedDate.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  return Math.round(diffHours * 10) / 10 // Round to 1 decimal
}

/**
 * Calculate SLA compliance percentage for a set of RFIs
 */
export function getSLACompliance(rfis: RFIForSLA[]): {
  total: number
  compliant: number
  percentage: number
} {
  const answeredRFIs = rfis.filter(rfi =>
    rfi.answered_at && rfi.response_due_date
  )

  const total = answeredRFIs.length

  if (total === 0) {
    return { total: 0, compliant: 0, percentage: 0 }
  }

  const compliant = answeredRFIs.filter(rfi => {
    const answeredDate = new Date(rfi.answered_at!)
    const dueDate = new Date(rfi.response_due_date!)
    return answeredDate <= dueDate
  }).length

  const percentage = Math.round((compliant / total) * 100)

  return { total, compliant, percentage }
}

/**
 * Calculate average response time for a set of RFIs
 */
export function getAverageResponseTime(rfis: RFIForSLA[]): number | null {
  const responseTimes = rfis
    .map(rfi => calculateResponseTime(rfi))
    .filter((time): time is number => time !== null)

  if (responseTimes.length === 0) {
    return null
  }

  const total = responseTimes.reduce((sum, time) => sum + time, 0)
  return Math.round((total / responseTimes.length) * 10) / 10
}

/**
 * Get days until due (negative if overdue)
 */
export function getDaysUntilDue(rfi: RFIForSLA): number | null {
  if (!rfi.response_due_date || rfi.status === 'closed' || rfi.status === 'cancelled') {
    return null
  }

  const dueDate = new Date(rfi.response_due_date)
  const now = new Date()

  const diffMs = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return diffDays
}
