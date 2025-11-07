/**
 * Get Organization Projects Health
 * Fetches all projects in an organization with aggregated cost/budget data
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { logger } from '@/lib/utils/logger'

export interface ProjectHealth {
  id: string
  name: string
  status: string
  budget: number
  totalSpent: number
  totalAllocated: number
  percentSpent: number
  healthStatus: 'healthy' | 'warning' | 'critical'
  invoiceCount: {
    total: number
    approved: number
    pending: number
    rejected: number
  }
  latestInvoiceDate: string | null
  categoryBreakdown: {
    labor: number
    materials: number
    equipment: number
    other: number
  }
}

export async function getOrgProjectsHealth(
  orgSlug: string
): Promise<ActionResponse<ProjectHealth[]>> {
  logger.debug('Fetching org projects health', {
    action: 'getOrgProjectsHealth',
    orgSlug,
  })

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.error('No user found', new Error('Authentication required'), {
        action: 'getOrgProjectsHealth',
      })
      throw new UnauthorizedError('You must be logged in')
    }

    // Get organization by slug
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .is('deleted_at', null)
      .single()

    if (orgError || !org) {
      logger.error('Organization not found', orgError || new Error('Org not found'), {
        action: 'getOrgProjectsHealth',
        orgSlug,
      })
      return { success: false, error: 'Organization not found' }
    }

    // Verify user is member of organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', org.id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (membershipError || !membership) {
      logger.error('Access denied - not org member', membershipError || new Error('Not authorized'), {
        action: 'getOrgProjectsHealth',
        orgSlug,
        userId: user.id,
      })
      throw new UnauthorizedError('You do not have access to this organization')
    }

    // Fetch all projects for the organization
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, status, budget')
      .eq('org_id', org.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (projectsError) {
      logger.error('Failed to fetch projects', projectsError, {
        action: 'getOrgProjectsHealth',
        orgSlug,
      })
      return { success: false, error: 'Failed to fetch projects' }
    }

    // For each project, fetch cost summary and invoice counts
    const projectHealthData: ProjectHealth[] = await Promise.all(
      (projects || []).map(async (project) => {
        // Fetch cost summary from materialized view
        const { data: costSummary } = await supabase
          .from('project_cost_summary')
          .select('category, allocated_amount, spent_amount')
          .eq('project_id', project.id)

        // Calculate totals
        const totalSpent = (costSummary || []).reduce(
          (sum, item) => sum + Number(item.spent_amount || 0),
          0
        )
        const totalAllocated = (costSummary || []).reduce(
          (sum, item) => sum + Number(item.allocated_amount || 0),
          0
        )

        // Calculate category breakdown
        const categoryBreakdown = {
          labor: 0,
          materials: 0,
          equipment: 0,
          other: 0,
        }

        ;(costSummary || []).forEach((item) => {
          const spent = Number(item.spent_amount || 0)
          if (item.category && item.category in categoryBreakdown) {
            categoryBreakdown[item.category as keyof typeof categoryBreakdown] = spent
          }
        })

        // Calculate percent spent
        const budget = Number(project.budget || 0)
        const percentSpent = budget > 0 ? (totalSpent / budget) * 100 : 0

        // Determine health status
        let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
        if (percentSpent >= 90) {
          healthStatus = 'critical'
        } else if (percentSpent >= 70) {
          healthStatus = 'warning'
        }

        // Fetch invoice counts by status
        const { data: invoices } = await supabase
          .from('project_invoices')
          .select('status, created_at')
          .eq('project_id', project.id)
          .is('deleted_at', null)

        const invoiceCount = {
          total: invoices?.length || 0,
          approved: invoices?.filter((i) => i.status === 'approved').length || 0,
          pending: invoices?.filter((i) => i.status === 'pending').length || 0,
          rejected: invoices?.filter((i) => i.status === 'rejected').length || 0,
        }

        // Get latest invoice date
        const latestInvoiceDate =
          invoices && invoices.length > 0
            ? [...invoices].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]?.created_at ?? null
            : null

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          budget,
          totalSpent,
          totalAllocated,
          percentSpent,
          healthStatus,
          invoiceCount,
          latestInvoiceDate,
          categoryBreakdown,
        }
      })
    )

    logger.info('Projects health fetched successfully', {
      action: 'getOrgProjectsHealth',
      orgSlug,
      projectCount: projectHealthData.length,
    })

    return { success: true, data: projectHealthData }
  } catch (error) {
    logger.error('Unexpected error fetching projects health', error as Error, {
      action: 'getOrgProjectsHealth',
      orgSlug,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects health',
    }
  }
}
