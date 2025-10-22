/**
 * Ball-in-Court Utility
 * Determines who is responsible for the next action on an RFI
 */

export type BallInCourt = {
  userId: string | null
  orgId: string | null
  suggestedAction: string
  isBlocked: boolean
}

export type RFIForBallInCourt = {
  status: string
  created_by: string
  assigned_to_id: string | null
  assigned_to_org: string | null
}

/**
 * Get the current ball-in-court holder and suggested next action
 */
export function getBallInCourt(rfi: RFIForBallInCourt): BallInCourt {
  switch (rfi.status) {
    case 'draft':
      return {
        userId: rfi.created_by,
        orgId: null,
        suggestedAction: 'Complete and submit RFI',
        isBlocked: false,
      }

    case 'submitted':
    case 'under_review':
      return {
        userId: rfi.assigned_to_id,
        orgId: rfi.assigned_to_org,
        suggestedAction: 'Review and provide response',
        isBlocked: !rfi.assigned_to_id && !rfi.assigned_to_org,
      }

    case 'answered':
      return {
        userId: rfi.created_by,
        orgId: null,
        suggestedAction: 'Review answer and close RFI',
        isBlocked: false,
      }

    case 'closed':
    case 'cancelled':
      return {
        userId: null,
        orgId: null,
        suggestedAction: 'No action required',
        isBlocked: false,
      }

    default:
      return {
        userId: null,
        orgId: null,
        suggestedAction: 'Unknown status',
        isBlocked: true,
      }
  }
}

/**
 * Check if the current user holds the ball-in-court
 */
export function isUserBallInCourt(rfi: RFIForBallInCourt, userId: string): boolean {
  const ballInCourt = getBallInCourt(rfi)
  return ballInCourt.userId === userId
}

/**
 * Get status color for UI rendering
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'gray'
    case 'submitted':
    case 'under_review':
      return 'blue'
    case 'answered':
      return 'yellow'
    case 'closed':
      return 'green'
    case 'cancelled':
      return 'red'
    default:
      return 'gray'
  }
}
