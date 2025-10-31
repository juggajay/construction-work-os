/**
 * RFI Overdue Digest Cron Job
 *
 * Sends daily digest emails to users with overdue RFIs
 * Should be triggered daily via Vercel Cron or similar service
 *
 * Example cron schedule (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/rfi-overdue-digest",
 *     "schedule": "0 9 * * *"  // Daily at 9am UTC
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendRFIOverdueEmail } from '@/lib/email/send-rfi-overdue'
import { isOverdue } from '@/lib/rfis/sla-calculations'
import type { OverdueRFI } from '@/lib/email/templates/rfi-overdue'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Get all overdue RFIs with assignee information
    const { data: overdueRfis, error: fetchError } = await supabase
      .from('rfis')
      .select(
        `
        id,
        number,
        title,
        status,
        priority,
        response_due_date,
        assigned_to_id,
        submitted_at,
        project_id,
        projects!inner (
          id,
          name,
          organization_id
        ),
        assigned_to:profiles!assigned_to_id (
          id,
          email,
          full_name
        )
      `
      )
      .in('status', ['submitted', 'under_review'])
      .not('assigned_to_id', 'is', null)
      .not('response_due_date', 'is', null)
      .is('deleted_at', null)

    if (fetchError) {
      logger.error('Failed to fetch overdue RFIs', fetchError, {
        action: 'rfi-overdue-digest',
      })
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!overdueRfis || overdueRfis.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No overdue RFIs found',
        sent: 0
      })
    }

    // Filter to only truly overdue RFIs
    const actuallyOverdue = overdueRfis.filter((rfi: any) => {
      return isOverdue({
        status: rfi.status || 'submitted',
        submitted_at: rfi.submitted_at,
        response_due_date: rfi.response_due_date,
        answered_at: null,
        closed_at: null,
      })
    })

    if (actuallyOverdue.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No overdue RFIs found after filtering',
        sent: 0
      })
    }

    // Group overdue RFIs by assignee
    const rfisByAssignee = new Map<string, typeof actuallyOverdue>()

    for (const rfi of actuallyOverdue) {
      const assigneeId = (rfi as any).assigned_to_id
      if (!assigneeId) continue

      if (!rfisByAssignee.has(assigneeId)) {
        rfisByAssignee.set(assigneeId, [])
      }
      rfisByAssignee.get(assigneeId)!.push(rfi)
    }

    // Send digest email to each assignee
    let emailsSent = 0
    const errors: string[] = []

    for (const [assigneeId, assigneeRfis] of rfisByAssignee.entries()) {
      const assignee = (assigneeRfis[0] as any).assigned_to
      if (!assignee || !assignee.email) {
        logger.warn('No email found for assignee', {
          action: 'rfi-overdue-digest',
          assigneeId,
        })
        continue
      }

      // Format RFIs for email template
      const overdueRfiList: OverdueRFI[] = assigneeRfis.map((rfi: any) => {
        const dueDate = new Date(rfi.response_due_date)
        const now = new Date()
        const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        // Construct view URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const org = rfi.projects.organization_id
        const viewUrl = `${appUrl}/${org}/projects/${rfi.project_id}/rfis/${rfi.id}`

        return {
          rfiNumber: rfi.number,
          rfiTitle: rfi.title,
          dueDate: rfi.response_due_date,
          daysOverdue,
          priority: rfi.priority,
          viewUrl,
        }
      })

      // Send digest email
      const result = await sendRFIOverdueEmail({
        to: assignee.email,
        recipientName: assignee.full_name || assignee.email,
        overdueRfis: overdueRfiList,
        isDigest: true,
      })

      if (result.success) {
        emailsSent++
      } else {
        errors.push(`Failed to send to ${assignee.email}: ${result.error}`)
      }
    }

    // Log results
    logger.info('RFI overdue digest completed', {
      action: 'rfi-overdue-digest',
      emailsSent,
      errorCount: errors.length,
      overdueCount: actuallyOverdue.length,
    })
    if (errors.length > 0) {
      logger.error('RFI overdue digest encountered errors', new Error('Digest errors'), {
        action: 'rfi-overdue-digest',
        errors,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${emailsSent} digest email(s)`,
      sent: emailsSent,
      overdueCount: actuallyOverdue.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    logger.error('RFI overdue digest cron error', error as Error, {
      action: 'rfi-overdue-digest',
    })
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
