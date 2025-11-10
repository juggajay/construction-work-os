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

    // ✅ OPTIMIZATION: Use batch function instead of N+1 queries
    // Previously: (N*2)+1 queries for N projects
    // Now: 1 function call
    // Expected improvement: 90% faster (8-12s → <1s for 100 projects)

    const { data: projectHealthResults, error: healthError } = await supabase
      .rpc('get_batch_project_health', { p_org_id: org.id })

    if (healthError) {
      logger.error('Failed to fetch project health data', healthError, {
        action: 'getOrgProjectsHealth',
        orgSlug,
      })
      return { success: false, error: 'Failed to fetch project health data' }
    }

    // Transform database results to ProjectHealth format
    const projectHealthData: ProjectHealth[] = (projectHealthResults || []).map((row: any) => {
      const budget = Number(row.project_budget || 0)
      const totalSpent = Number(row.total_spent || 0)
      const totalAllocated = Number(row.total_allocated || 0)
      const percentSpent = budget > 0 ? (totalSpent / budget) * 100 : 0

      // Determine health status based on percent spent
      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (percentSpent >= 90) {
        healthStatus = 'critical'
      } else if (percentSpent >= 70) {
        healthStatus = 'warning'
      }

      return {
        id: row.project_id,
        name: row.project_name,
        status: row.project_status,
        budget,
        totalSpent,
        totalAllocated,
        percentSpent,
        healthStatus,
        invoiceCount: {
          total: row.invoice_count_total || 0,
          approved: row.invoice_count_approved || 0,
          pending: row.invoice_count_pending || 0,
          rejected: row.invoice_count_rejected || 0,
        },
        latestInvoiceDate: row.latest_invoice_date,
        categoryBreakdown: {
          labor: Number(row.category_labor || 0),
          materials: Number(row.category_materials || 0),
          equipment: Number(row.category_equipment || 0),
          other: Number(row.category_other || 0),
        },
      }
    })

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
